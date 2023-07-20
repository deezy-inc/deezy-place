/* eslint-disable react/forbid-prop-types */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
  generateDeezyPSBTListingForBuy,
  getAvailableUtxosWithoutDummies,
  TESTNET,
  NETWORK,
  shortenStr,
  satsToFormattedDollarString,
  signPsbtListingForBuy,
  calculateRequiredFeeForBuy,
  fetchRecommendedFee,
  DEFAULT_FEE_RATE,
} from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TailSpin } from "react-loading-icons";
import { toast } from "react-toastify";
import { InscriptionPreview } from "@components/inscription-preview";
import { NostrEvenType } from "@utils/types";
import TransactionSent from "@components/transaction-sent-confirmation";
import { useDelayUnmount } from "@hooks";
import clsx from "clsx";
import { useWallet } from "@context/wallet-context";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
import axios from "axios";
import { invalidateOutputsCache, getPsbt } from "@services/nosft";

bitcoin.initEccLib(ecc);

const BuyModal = ({ show, handleModal, utxo, onSale, nostr }) => {
  const {
    nostrOrdinalsAddress,
    nostrPaymentAddress,
    ordinalsPublicKey,
    paymentPublicKey,
  } = useWallet();
  const [
    isOrdinalDestinationAddressValid,
    setIsOrdinalDestinationAddressValid,
  ] = useState(true);
  const [ordinalsDestinationAddress, setOrdinalsDestinationAddress] =
    useState(nostrOrdinalsAddress);
  const [isOnBuy, setIsOnBuy] = useState(false);
  const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
  const [buyTxId, setBuyTxId] = useState(null);

  const [isMounted, setIsMounted] = useState(true);
  const showDiv = useDelayUnmount(isMounted, 500);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const feeRateOnChange = (evt) => setSendFeeRate(parseInt(evt.target.value));

  const getPopulatedDeezyPsbt = async () => {
    const { data } = await axios.post(
      `https://api${
        TESTNET ? "-testnet" : ""
      }.deezy.io/v1/ordinals/psbt/populate`,
      {
        psbt: nostr.content, // (hex or base64)
        ordinal_receive_address: ordinalsDestinationAddress,
      },
    );
    return data;
  };

  const getSelectedUtxo = async (psbt) => {
    if (!psbt || !nostrPaymentAddress) return;

    const deezyPsbt = bitcoin.Psbt.fromHex(psbt, {
      network: NETWORK,
    });

    const { selectedUtxos, dummyUtxos } = await getAvailableUtxosWithoutDummies(
      {
        address: nostrPaymentAddress,
        price: nostr.value,
        psbt: deezyPsbt,
        fee: null,
        selectedFeeRate: sendFeeRate,
      },
    );

    if (dummyUtxos.length < 2) {
      throw new Error(
        "No dummy UTXOs found. Please create them before continuing.",
      );
    }

    return selectedUtxos;
  };

  const onChangeAddress = async (evt) => {
    const newaddr = evt.target.value;
    if (newaddr === "") {
      setIsOrdinalDestinationAddressValid(true);
      return;
    }
    if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
      setIsOrdinalDestinationAddressValid(false);
      return;
    }
    setOrdinalsDestinationAddress(newaddr);
  };

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await fetchRecommendedFee();
      setSendFeeRate(fee);
    };
    fetchFee();
  }, [ordinalsDestinationAddress]);

  const buy = async () => {
    setIsOnBuy(true);

    try {
      // Step 1 we call deezy api to get the psbt with the dummy utxos.
      const { psbt, id } = await getPopulatedDeezyPsbt();
      const selectedUtxos = await getSelectedUtxo(psbt);
      const sellerSignedPsbt = getPsbt(nostr.content);

      const deezyPsbt = bitcoin.Psbt.fromHex(psbt, {
        network: NETWORK,
      });

      // Step 2, we add our payment data
      const { psbt: psbtForBuy } = await generateDeezyPSBTListingForBuy({
        paymentAddress: nostrPaymentAddress,
        ordinalsDestinationAddress,
        paymentPublicKey,
        ordinalsPublicKey,
        price: nostr.value,
        paymentUtxos: selectedUtxos,
        sellerSignedPsbt,
        psbt: deezyPsbt,
        selectedFeeRate: sendFeeRate,
      });

      // Step 3, we sign the psbt
      const signedPsbt = await signPsbtListingForBuy({
        psbt: psbtForBuy,
        ordinalsAddress: nostrOrdinalsAddress,
        paymentAddress: nostrPaymentAddress,
      });

      // Step 4, we finalize the psbt and broadcast it
      const { data: finalizeData } = await axios.post(
        `https://api${
          TESTNET ? "-testnet" : ""
        }.deezy.io/v1/ordinals/psbt/finalize`,
        {
          psbt: signedPsbt, // (hex or base64)
          id,
        },
      );

      // Step 5, invalidate outputs data to avoid missing outputs
      invalidateOutputsCache();

      const { txid: txId } = finalizeData;

      setBuyTxId(txId);
      toast.info(`Order successfully signed! ${txId}`);
      navigator.clipboard.writeText(txId);

      // Display confirmation component
      setIsMounted(!isMounted);
    } catch (e) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsOnBuy(false);
    }
  };

  const closeModal = () => {
    onSale();
    handleModal();
  };

  const submit = async () => {
    if (!ordinalsDestinationAddress) return;
    if (!isOrdinalDestinationAddressValid) return;

    await buy();
  };

  const renderBody = () => {
    if (!showDiv && buyTxId) {
      return (
        <div className="show-animated">
          <TransactionSent
            txId={buyTxId}
            onClose={closeModal}
            title="Transaction Sent"
          />
        </div>
      );
    }

    return (
      <div className={clsx(!isMounted && "hide-animated")}>
        <p>You are about to buy this Ordinal</p>
        <div className="inscription-preview">
          <InscriptionPreview utxo={utxo} />
        </div>

        <div className="placebid-form-box">
          <div className="bid-content">
            <div className="bid-content-top">
              <div className="bid-content-left">
                <InputGroup className="mb-lg-5 notDummy">
                  <Form.Label>Address to receive ordinal</Form.Label>
                  <Form.Control
                    defaultValue={ordinalsDestinationAddress}
                    onChange={onChangeAddress}
                    placeholder="Ordinal buyer address"
                    aria-label="Ordinal buyer address"
                    aria-describedby="basic-addon2"
                    isInvalid={!isOrdinalDestinationAddressValid}
                    autoFocus
                  />

                  <Form.Control.Feedback type="invalid">
                    <br />
                    No dummy UTXOs found for your address
                  </Form.Control.Feedback>
                </InputGroup>

                <InputGroup className="mb-3">
                  <Form.Label>Select a fee rate</Form.Label>
                  <Form.Range
                    min="1"
                    max="100"
                    defaultValue={sendFeeRate}
                    onChange={feeRateOnChange}
                  />
                </InputGroup>
              </div>
            </div>

            <div className="bid-content-mid">
              <div className="bid-content-left">
                {Boolean(ordinalsDestinationAddress) && (
                  <span>Receive Address</span>
                )}

                {Boolean(nostr?.value) && <span>Price</span>}
                <span>Fee rate</span>
              </div>
              <div className="bid-content-right">
                {Boolean(ordinalsDestinationAddress) && (
                  <span>{shortenStr(ordinalsDestinationAddress)}</span>
                )}
                {Boolean(nostr?.value) && Boolean(bitcoinPrice) && (
                  <span>{`$${satsToFormattedDollarString(
                    nostr.value,
                    bitcoinPrice,
                  )}`}</span>
                )}
                <span>{sendFeeRate} sat/vbyte</span>
              </div>
            </div>
          </div>

          <div className="bit-continue-button notDummy">
            <Button
              size="medium"
              fullwidth
              disabled={!ordinalsDestinationAddress}
              autoFocus
              className={isOnBuy ? "btn-loading" : ""}
              onClick={submit}
            >
              {isOnBuy ? <TailSpin stroke="#fec823" speed={0.75} /> : "Buy"}
            </Button>
          </div>
        </div>
      </div>
    );
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
      {showDiv && (
        <Modal.Header>
          <h3 className={clsx("modal-title", !isMounted && "hide-animated")}>
            Buy {shortenStr(utxo && `${utxo.inscriptionId}`)}
          </h3>
        </Modal.Header>
      )}
      <Modal.Body>{renderBody()}</Modal.Body>
    </Modal>
  );
};

BuyModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  onSale: PropTypes.func,
  nostr: NostrEvenType,
};
export default BuyModal;
