/* eslint-disable */
import { useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
  publishOrder,
  generatePSBTListingInscriptionForSale,
  signPsbtMessage,
  shortenStr,
  satsToFormattedDollarString,
  TESTNET,
} from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { useWallet } from "@context/wallet-context";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";

bitcoin.initEccLib(ecc);

const SellModal = ({ show, handleModal, utxo, onSale }) => {
  const { nostrOrdinalsAddress, nostrPaymentAddress, ordinalsPublicKey } =
    useWallet();

  const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
  const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
  const [destinationBtcAddress, setDestinationBtcAddress] =
    useState(nostrPaymentAddress);
  const [ordinalValue, setOrdinalValue] = useState(utxo.value);
  const [isOnSale, setIsOnSale] = useState(false);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const sale = async () => {
    setIsOnSale(true);

    const psbt = await generatePSBTListingInscriptionForSale({
      utxo,
      paymentAddress: destinationBtcAddress,
      price: ordinalValue,
      pubkey: ordinalsPublicKey,
    });

    try {
      const signedPsbt = await signPsbtMessage(
        psbt.toBase64(),
        nostrOrdinalsAddress
      );

      await publishOrder({
        utxo,
        ordinalValue,
        signedPsbt: signedPsbt.toBase64(),
      });

      toast.info(`Order successfully published to Nostr!`);
    } catch (e) {
      toast.error(e.message);
    }

    setIsOnSale(false);
    onSale();
    handleModal();
  };

  const submit = async () => {
    if (!destinationBtcAddress) return;
    if (!isBtcAmountValid) return;
    if (!isBtcInputAddressValid) return;

    await sale();
  };

  const priceOnChange = (evt) => {
    const newValue = evt.target.value;
    if (newValue === "") {
      setIsBtcAmountValid(true);
      return;
    }

    if (!newValue) {
      setIsBtcAmountValid(false);
      return;
    }

    setOrdinalValue(Number(newValue));
  };

  const addressOnChange = (evt) => {
    const newaddr = evt.target.value;
    if (newaddr === "") {
      setIsBtcInputAddressValid(true);
      return;
    }
    if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
      setIsBtcInputAddressValid(false);
      return;
    }
    setDestinationBtcAddress(newaddr);
  };

  return (
    <Modal
      className="rn-popup-modal placebid-modal-wrapper"
      show={show}
      onHide={handleModal}
      centered
    >
      {show && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={handleModal}
        >
          <i className="feather-x" />
        </button>
      )}
      <Modal.Header>
        <h3 className="modal-title">
          Sell {shortenStr(utxo && `${utxo.inscriptionId}`)}
        </h3>
      </Modal.Header>
      <Modal.Body>
        <p>You are about to sell this Ordinal</p>
        <div className="inscription-preview">
          <InscriptionPreview utxo={utxo} />
        </div>

        <div className="placebid-form-box">
          <div className="bid-content">
            <div className="bid-content-top">
              <div className="bid-content-left">
                <InputGroup className="mb-lg-5 omg">
                  <Form.Label>Address to receive payment</Form.Label>
                  <Form.Control
                    defaultValue={nostrPaymentAddress}
                    onChange={addressOnChange}
                    placeholder="Paste BTC address to receive your payment here"
                    aria-label="Paste BTC address to receive your payment here"
                    aria-describedby="basic-addon2"
                    isInvalid={!isBtcInputAddressValid}
                    autoFocus
                  />

                  <Form.Control.Feedback type="invalid">
                    <br />
                    That is not a valid {TESTNET ? "testnet" : "mainnet"} BTC
                    address
                  </Form.Control.Feedback>
                </InputGroup>

                <InputGroup className="mb-lg-5">
                  <Form.Label>Price (in Sats)</Form.Label>
                  <Form.Control
                    defaultValue={utxo.value}
                    onChange={priceOnChange}
                    type="number"
                    placeholder="Price (in Sats)"
                    aria-label="Price (in Sats)"
                    aria-describedby="basic-addon2"
                    isInvalid={!isBtcAmountValid}
                    autoFocus
                  />

                  <Form.Control.Feedback type="invalid">
                    <br />
                    Invalid amount
                  </Form.Control.Feedback>
                </InputGroup>
              </div>
            </div>

            <div className="bid-content-mid">
              <div className="bid-content-left">
                {!!destinationBtcAddress && (
                  <span>Payment Receive Address</span>
                )}
                {Boolean(ordinalValue) && bitcoinPrice && <span>Price</span>}
              </div>
              <div className="bid-content-right">
                {!!destinationBtcAddress && (
                  <span>{shortenStr(destinationBtcAddress)}</span>
                )}

                {Boolean(ordinalValue) && bitcoinPrice && (
                  <span>{`$${satsToFormattedDollarString(
                    ordinalValue,
                    bitcoinPrice
                  )}`}</span>
                )}
              </div>
            </div>
          </div>

          <div className="bit-continue-button">
            <Button
              size="medium"
              fullwidth
              disabled={!destinationBtcAddress}
              autoFocus
              className={isOnSale ? "btn-loading" : ""}
              onClick={submit}
            >
              {isOnSale ? <TailSpin stroke="#fec823" speed={0.75} /> : "Sell"}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

SellModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  onSale: PropTypes.func,
};
export default SellModal;
