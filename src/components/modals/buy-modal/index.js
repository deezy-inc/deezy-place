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
  TESTNET,
  shortenStr,
  satsToFormattedDollarString,
  signPsbtListingForBuy,
  getFundingUtxosForBuy,
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

const BuyModal = ({ show, handleModal, utxo, onSale, nostr: _nostr }) => {
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
  const [buyFeeRate, setBuyFeeRate] = useState(DEFAULT_FEE_RATE);
  const [buyTxId, setBuyTxId] = useState(null);

  const [isMounted, setIsMounted] = useState(true);
  const showDiv = useDelayUnmount(isMounted, 500);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const feeRateOnChange = (evt) => setBuyFeeRate(parseInt(evt.target.value));

  const isUninscribed = !Boolean(utxo?.inscriptionId);
  const nostr = _nostr
    ? _nostr
    : {
        content: utxo?.content,
        created_at: utxo?.created_at,
        id: utxo?.id,
        kind: utxo?.kind,
        pubkey: utxo?.pubkey,
        sig: utxo?.sig,
        tags: utxo?.tags,
        value: utxo?.value,
      };

  const getPopulatedDeezyPsbt = async (psbt) => {
    const { data } = await axios.post(
      `https://api${
        TESTNET ? "-testnet" : ""
      }.deezy.io/v1/ordinals/psbt/populate`,
      {
        psbt, // (hex or base64)
        ordinal_receive_address: ordinalsDestinationAddress,
      },
    );
    return data;
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
      setBuyFeeRate(fee);
    };
    fetchFee();
  }, [ordinalsDestinationAddress]);

  const title = `Buy ${shortenStr(
    isUninscribed ? utxo.output : `${utxo ? utxo.inscriptionId : ""}`,
  )}`;

  const subtitle = `You are about to buy this ${
    utxo.inscriptionId ? "ordinal" : "UTXO"
  }`;

  const buy = async () => {
    setIsOnBuy(true);

    try {
      const sellerPsbt = getPsbt(nostr.content);

      const { selectedUtxos } = await getFundingUtxosForBuy({
        address: nostrPaymentAddress,
        offerPrice: nostr.value,
        sellerPsbt: sellerPsbt,
        selectedFeeRate: buyFeeRate,
      });

      // Step 1 we call deezy api to get the psbt with the dummy utxos.
      const { psbt, id } = await getPopulatedDeezyPsbt(nostr.content);
      const deezyPsbt = getPsbt(psbt);

      // Step 2, we add our payment data
      const { psbt: psbtForBuy } = await generateDeezyPSBTListingForBuy({
        paymentAddress: nostrPaymentAddress,
        ordinalsDestinationAddress,
        paymentPublicKey,
        ordinalsPublicKey,
        price: nostr.value,
        paymentUtxos: selectedUtxos,
        sellerSignedPsbt: deezyPsbt,
        psbt: deezyPsbt,
        selectedFeeRate: buyFeeRate,
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
        <p>{subtitle}</p>
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
                    defaultValue={buyFeeRate}
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
                <span>{buyFeeRate} sat/vbyte</span>
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
            {title}
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
