/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
  signAndBroadcastUtxo,
  shortenStr,
  outputValue,
  fetchRecommendedFee,
  getInscriptions,
  TESTNET,
  DEFAULT_FEE_RATE,
  MIN_OUTPUT_VALUE,
} from "@services/nosft";

import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import TransactionSent from "@components/transaction-sent-confirmation";
import { SendBulkModal } from "@components/modals/send-bulk-modal";
import { useWallet } from "@context/wallet-context";

const SendModal = ({
  show,
  handleModal,
  utxo,
  onSend,
  isUninscribed = false,
}) => {
  const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
  const [destinationBtcAddress, setDestinationBtcAddress] = useState("");
  const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
  const [sentTxId, setSentTxId] = useState(null);
  const { ordinalsPublicKey, nostrOrdinalsAddress } = useWallet();
  const [isSending, setIsSending] = useState(false);
  const [showTransactionSent, setShowTransactionSent] = useState(false);
  const [ownedUtxos, setOwnedUtxos] = useState(null);

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await fetchRecommendedFee();
      setSendFeeRate(fee);
    };

    fetchFee();
  }, []);

  // Sending a utxo whose remaining value would fall below the minimum output
  // value needs extra cardinal inputs to fund the transfer, which is what the
  // bulk send flow does. Route those sends through it with this utxo selected.
  const lowValueSend =
    !!utxo &&
    !!sendFeeRate &&
    outputValue(utxo, sendFeeRate) < MIN_OUTPUT_VALUE;

  useEffect(() => {
    if (!lowValueSend || !nostrOrdinalsAddress || ownedUtxos) return;
    const fetchOwnedUtxos = async () => {
      try {
        const utxos = await getInscriptions(nostrOrdinalsAddress);
        setOwnedUtxos(utxos);
      } catch (error) {
        console.error(error);
        setOwnedUtxos([]);
      }
    };
    fetchOwnedUtxos();
  }, [lowValueSend, nostrOrdinalsAddress, ownedUtxos]);

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

    setIsBtcInputAddressValid(true);
    setDestinationBtcAddress(newaddr);
  };

  const feeRateOnChange = (evt) => {
    setSendFeeRate(parseInt(evt.target.value));
  };

  const handleTransactionSentClose = () => {
    setShowTransactionSent(false);
  };

  const submit = async () => {
    // Validate fee rate before submitting
    if (sendFeeRate < 1) {
      toast.error("Fee rate must be at least 1 sat/vbyte");
      return;
    }

    setIsSending(true);

    try {
      const txId = await signAndBroadcastUtxo({
        pubKey: ordinalsPublicKey,
        address: nostrOrdinalsAddress,
        utxo,
        destinationBtcAddress,
        sendFeeRate,
      });

      console.log("Setting transaction sent state:", txId);
      setSentTxId(txId);
      setShowTransactionSent(true);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (lowValueSend) {
    return (
      <SendBulkModal
        show={show}
        handleModal={handleModal}
        onSend={onSend}
        ownedUtxos={ownedUtxos || []}
        selectedUtxos={[utxo]}
      />
    );
  }

  const renderBody = () => {
    return (
      <div>
        <p>
          You are about to send this {utxo.inscriptionId ? "ordinal" : "UTXO"}
        </p>
        {!isUninscribed && (
          <div className="inscription-preview">
            <InscriptionPreview utxo={utxo} />
          </div>
        )}

        <div className="placebid-form-box">
          <div className="bid-content">
            <div className="bid-content-top">
              <div className="bid-content-left">
                <InputGroup className="mb-lg-5">
                  <Form.Control
                    onChange={addressOnChange}
                    placeholder="Paste BTC address here"
                    aria-label="Paste BTC address heres"
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
                <InputGroup className="mb-3">
                  <Form.Label>Select a fee rate</Form.Label>
                  <Form.Range
                    min="1"
                    max="1200"
                    defaultValue={sendFeeRate}
                    onChange={feeRateOnChange}
                  />
                </InputGroup>
              </div>
            </div>
            <div className="bid-content-mid">
              <div className="bid-content-left">
                {!!destinationBtcAddress && <span>Destination</span>}
                <span>Fee rate</span>
                <span>Output Value</span>
              </div>
              <div className="bid-content-right">
                {!!destinationBtcAddress && (
                  <span>{shortenStr(destinationBtcAddress)}</span>
                )}
                <span>{sendFeeRate} sat/vbyte</span>
                <span>
                  {utxo && sendFeeRate && outputValue(utxo, sendFeeRate)} sats
                </span>
              </div>
            </div>
          </div>

          <div className="bit-continue-button">
            <Button
              size="medium"
              fullwidth
              disabled={!destinationBtcAddress}
              className={isSending ? "btn-loading" : ""}
              onClick={submit}
            >
              {isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Send"}
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
      {!showTransactionSent && (
        <Modal.Header>
          <h3 className="modal-title">
            Send {shortenStr(utxo && `${utxo.txid}:${utxo.vout}`)}
          </h3>
        </Modal.Header>
      )}
      {showTransactionSent && (
        <div className="show-animated">
          <TransactionSent
            txId={sentTxId}
            onClose={handleTransactionSentClose}
            title="Transaction Sent"
          />
        </div>
      )}
      {!showTransactionSent && <Modal.Body>{renderBody()}</Modal.Body>}
    </Modal>
  );
};

SendModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  isUninscribed: PropTypes.bool,
  onSend: PropTypes.func.isRequired,
};

export default SendModal;
