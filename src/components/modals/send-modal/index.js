/* eslint-disable react/forbid-prop-types */
import { useState, useEffect, useRef } from "react";
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
  createPsbtForBoost,
  signPsbtForBoost,
  TESTNET,
  DEFAULT_FEE_RATE,
  MIN_OUTPUT_VALUE,
  BOOST_UTXO_VALUE,
  MEMPOOL_API_URL,
} from "@services/nosft";
import axios from "axios";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import TransactionSent from "@components/transaction-sent-confirmation";
import LightningPaymentModal from "@components/modals/lightning-payment-modal";
import clsx from "clsx";
import { useWallet } from "@context/wallet-context";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

bitcoin.initEccLib(ecc);

const DEFAULT_BOOST_UTXO_VALUE = 600;
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
  const [boostOutputValue, setBoostOutputValue] = useState(DEFAULT_BOOST_UTXO_VALUE);
  const [sentTxId, setSentTxId] = useState(null);
  const { ordinalsPublicKey, nostrOrdinalsAddress } = useWallet();
  const [isSending, setIsSending] = useState(false);
  const [showLightningModal, setShowLightningModal] = useState(false);
  const [bolt11Invoice, setBolt11Invoice] = useState("");
  const [deezyId, setDeezyId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [expectedTxId, setExpectedTxId] = useState(null);
  const [showTransactionSent, setShowTransactionSent] = useState(false);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await fetchRecommendedFee();
      setSendFeeRate(fee);
    };

    fetchFee();
  }, []);

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

  const boostOutputValueChange = (evt) => {
    setBoostOutputValue(parseInt(evt.target.value));
  }

  const boostRequired =
    !!utxo &&
    !!sendFeeRate &&
    outputValue(utxo, sendFeeRate) < MIN_OUTPUT_VALUE;

    const stopPolling = () => {
      // Clean up polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

  const handleTransactionSentClose = () => {
    setShowTransactionSent(false);
  };

  const handlePayWithLightning = async (invoice) => {
    try {
      if (window.webln) {
        if (!window.webln.enabled) await window.webln.enable();
        const result = await window.webln.sendPayment(invoice);
        
        setShowTransactionSent(true);
        setShowLightningModal(false);
        stopPolling();
      } else {
        throw new Error("No lightning wallet extension found");
      }
    } catch (error) {
      console.error("Lightning payment failed:", error);
      throw error;
    }
  };

  const checkPaymentStatus = async () => {
    if (!expectedTxId) return;
    
    try {
      // Check if the transaction has been broadcast to the blockchain
      const response = await axios.get(
        `${MEMPOOL_API_URL}/api/tx/${expectedTxId}`
      );
      
      if (response.status === 200) {
        // Transaction found on blockchain - payment successful
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
        
        setShowLightningModal(false);
        setShowTransactionSent(true);
        stopPolling();
      }
    } catch (error) {
      // Transaction not found yet, continue polling
      if (error.response && error.response.status === 404) {
        // This is expected - transaction not yet broadcast
        return;
      }
      console.error("Error checking transaction status:", error);
    }
  };

  // Polling effect: start when modal is shown and expectedTxId is set
  useEffect(() => {
    if (showLightningModal && expectedTxId && !isPolling) {
      setIsPolling(true);
      pollingIntervalRef.current = setInterval(checkPaymentStatus, 1000); // 1s
      // Stop polling after 5 minutes
      const timeout = setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsPolling(false);
        }
      }, 300000);
      return () => clearTimeout(timeout);
    }
    // Cleanup when modal closes or expectedTxId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
      }
    };
  }, [showLightningModal, expectedTxId]);

  // Remove polling logic from handleCopyInvoice
  const handleCopyInvoice = async (invoice) => {
    await navigator.clipboard.writeText(invoice);
  };

  const submit = async () => {
    // Validate fee rate before submitting
    if (sendFeeRate < 1) {
      toast.error("Fee rate must be at least 1 sat/vbyte");
      return;
    }
    
    setIsSending(true);

    const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);

    if (boostRequired) {
      try {
        // Step 1, create PSBT
        const signedTxHex = await createPsbtForBoost({
          pubKey: ordinalsPublicKey,
          utxo,
          destinationBtcAddress,
          outputValue: boostOutputValue,
          sighashType: bitcoin.Transaction.SIGHASH_ALL,
        });

        // Step 2, add deezy inputs/outputs
        const { data } = await axios.post(
          `https://api${TESTNET ? "-testnet" : ""}.deezy.io/v1/boost-tx`,
          {
            psbt: signedTxHex,
            fee_rate: sendFeeRate,
          },
        );
        // Step 3, sign our input
        const { funded_unsigned_psbt, id } = data;
        const fundedPsbt = bitcoin.Psbt.fromHex(funded_unsigned_psbt);
        const signedPsbtHex = await signPsbtForBoost({
          address: nostrOrdinalsAddress,
          psbt: fundedPsbt,
        });

        // Step 4, update deezy with our signed input
        await axios.put(
          `https://api${TESTNET ? "-testnet" : ""}.deezy.io/v1/boost-tx`,
          {
            id,
            psbt: signedPsbtHex,
          },
        );
        
        // Extract expected transaction ID from the funded PSBT
        console.log(signedPsbtHex)
        const finalPsbt = bitcoin.Psbt.fromHex(signedPsbtHex);
        const txId = finalPsbt.__CACHE.__TX.getId()
        
        // Step 5, show lightning payment modal instead of immediately paying
        setBolt11Invoice(data.bolt11_invoice);
        setDeezyId(id);
        setExpectedTxId(txId);
        setShowLightningModal(true);
        setIsSending(false);
        setSentTxId(txId);
        return;
      } catch (e) {
        console.error(e);
        
        // Handle different types of errors
        let errorMessage = "An error occurred while processing your transaction.";
        
        if (e.response) {
          // Server responded with error status
          const status = e.response.status;
          const data = e.response.data;
          
          if (status === 400) {
            if (data && data.error) {
              errorMessage = data.error;
            } else if (data && data.message) {
              errorMessage = data.message;
            } else {
              errorMessage = "Invalid request. Please check your fee rate and try again.";
            }
          } else if (status === 422) {
            errorMessage = "Fee rate too low. Please increase the fee rate and try again.";
          } else if (status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        } else if (e.request) {
          // Network error
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          // Other error
          errorMessage = e.message || errorMessage;
        }
        
        toast.error(errorMessage);
        setIsSending(false);
      }
      return;
    }

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
                { boostRequired ?
                  <InputGroup className="mb-3">
                    <Form.Label>Select an output value</Form.Label>
                    <Form.Range
                      min="330"
                      max="10000"
                      value={boostOutputValue}
                      onChange={boostOutputValueChange}
                    />
                  </InputGroup>
                  : <></>
                }
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
                  {boostRequired
                    ?
                    boostOutputValue
                    : utxo &&
                      sendFeeRate &&
                      outputValue(utxo, sendFeeRate)}{" "}
                  sats
                </span>
              </div>
            </div>
            {boostRequired && (
              <span>
                Sending will require a small lightning payment to boost the utxo
                value
                <br />
                <br />
              </span>
            )}
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
    <>
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
        { showTransactionSent && (
            <div className="show-animated">
              <TransactionSent
                txId={sentTxId}
                onClose={handleTransactionSentClose}
                title="Transaction Sent"
              />
            </div>
        )}
        {
          showLightningModal && (
           <LightningPaymentModal
              show={showLightningModal}
              handleModal={() => setShowLightningModal(false)}
              bolt11Invoice={bolt11Invoice}
              onPayWithLightning={handlePayWithLightning}
              onCopyInvoice={handleCopyInvoice}
              isProcessing={isSending}
              isPolling={isPolling}
            />
          )
        }
        {!showTransactionSent && !showLightningModal && (
          <Modal.Body>{renderBody()}</Modal.Body>
        )}
        
      </Modal>

      
    </>
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
