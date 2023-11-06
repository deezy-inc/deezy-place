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
  satToBtc,
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
import { MAX_FILE_SIZE, LABEL_LIMIT_FILE } from "@lib/constants.config";
import { toKB, textBytes, totalSats } from "@utils/methods";

bitcoin.initEccLib(ecc);

const InscribeModal = ({ show, handleModal, message }) => {
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
  const [mintAttemptId, setMintAttemptId] = useState(null);

  const [isMounted, setIsMounted] = useState(true);
  const showDiv = useDelayUnmount(isMounted, 500);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const feeRateOnChange = (evt) => setBuyFeeRate(parseInt(evt.target.value));

  useEffect(() => {
    if (nostrOrdinalsAddress && !ordinalsDestinationAddress) {
      setOrdinalsDestinationAddress(nostrOrdinalsAddress);
    }
  }, [nostrOrdinalsAddress]);

  const textSize = textBytes(message);
  const sats = totalSats({
    fileSize: textSize,
    fee: buyFeeRate,
    isCursed: false,
  });

  const btcPrice = satToBtc(sats);

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

  const deezyMintEndpoint = `https://api${
    TESTNET ? "-testnet" : ""
  }.deezy.io/v1/inscriptions/mint?mint_id`;

  const mint = async (payload) => {
    const { data } = await axios.post(
      `https://api${TESTNET ? "-testnet" : ""}.deezy.io/v1/inscriptions/mint`,
      payload,
    );
    return data;
  };

  const inscribe = async () => {
    setIsOnBuy(true);

    try {
      const utf8Bytes = new TextEncoder().encode(message);
      const base64String = btoa(String.fromCharCode(...utf8Bytes));

      const params = {
        file_data_base64: base64String,
        file_extension: "txt",
        on_chain_fee_rate: buyFeeRate,
        receive_address: ordinalsDestinationAddress,
        cursed: false,
      };

      const { bolt11_invoice, mint_attempt_id, payment_address, amount_sats } =
        await mint(params);

      setMintAttemptId(mint_attempt_id);

      // Display confirmation component
      setIsMounted(!isMounted);
      let result;
      if (window.webln) {
        if (!window.webln.enabled) await window.webln.enable();
        result = await window.webln.sendPayment(bolt11_invoice);

        navigator.clipboard.writeText(result.paymentHash);
        toast.success(
          `Transaction sent: ${result.paymentHash}, copied to clipboard`,
        );

        setBuyTxId(result.paymentHash);
        // Display confirmation component
        setIsMounted(!isMounted);
      } else {
        result = data.bolt11_invoice;
        navigator.clipboard.writeText(result);
        toast.success(
          `Please pay the following LN invoice to complete your payment: ${result}, copied to clipboard`,
        );
      }
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

    await inscribe();
  };

  const renderBody = () => {
    console.log(!showDiv && buyTxId);
    if (!showDiv && buyTxId) {
      return (
        <div className="show-animated">
          <TransactionSent
            txId={buyTxId}
            onClose={closeModal}
            url={`${deezyMintEndpoint}=${mintAttemptId}`}
            title="Minting Pending..."
          />
        </div>
      );
    }

    return (
      <div className={clsx(!isMounted && "hide-animated")}>
        <p>{message}</p>

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

                <span>Text Size</span>
                <span>Fee rate</span>
                <span>Total BTC</span>
                <span>Total </span>
              </div>
              <div className="bid-content-right">
                {Boolean(ordinalsDestinationAddress) && (
                  <span>{shortenStr(ordinalsDestinationAddress)}</span>
                )}

                <span>{toKB(textSize)}</span>

                <span>{buyFeeRate} sat/vbyte</span>
                <span>{btcPrice}</span>
                {Boolean(sats) &&
                  sats > 0 &&
                  bitcoinPrice &&
                  bitcoinPrice > 0 && (
                    <span>{`$${satsToFormattedDollarString(
                      sats,
                      bitcoinPrice,
                    )}`}</span>
                  )}
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
              {isOnBuy ? (
                <TailSpin stroke="#fec823" speed={0.75} />
              ) : (
                "Inscribe"
              )}
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
            Inscribe
          </h3>
        </Modal.Header>
      )}
      <Modal.Body>{renderBody()}</Modal.Body>
    </Modal>
  );
};

InscribeModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  message: PropTypes.string,
};
export default InscribeModal;
