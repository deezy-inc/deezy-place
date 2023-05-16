/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
    createAndSignPsbtForBoost,
    signAndBroadcastUtxo,
    shortenStr,
    outputValue,
    TESTNET,
    DEFAULT_FEE_RATE,
    MIN_OUTPUT_VALUE,
    BOOST_UTXO_VALUE,
    DEEZY_BOOST_API,
} from "@services/nosft";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import axios from "axios";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import TransactionSent from "@components/transaction-sent-confirmation";
import { useDelayUnmount } from "@hooks";
import clsx from "clsx";

bitcoin.initEccLib(ecc);

const SendModal = ({ show, handleModal, utxo, onSale }) => {
    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [destinationBtcAddress, setDestinationBtcAddress] = useState("");
    const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
    const [sentTxId, setSentTxId] = useState(null);
    const [nostrPublicKey, setNostrPublicKey] = useState();
    const [isSending, setIsSending] = useState(false);

    const [isMounted, setIsMounted] = useState(true);
    const showDiv = useDelayUnmount(isMounted, 500);

    useEffect(() => {
        const pubKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);
        if (pubKey) {
            setNostrPublicKey(pubKey);
        }
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

    const feeRateOnChange = (evt) => setSendFeeRate(evt.target.value);

    const boostRequired = !!utxo && !!sendFeeRate && outputValue(utxo, sendFeeRate) < MIN_OUTPUT_VALUE;

    const closeModal = () => {
        onSale();
        handleModal();
    };

    const submit = async () => {
        setIsSending(true);

        if (boostRequired) {
            try {
                let result;
                const signedTxHex = await createAndSignPsbtForBoost({
                    pubKey: nostrPublicKey,
                    utxo,
                    destinationBtcAddress,
                });
                const { data } = await axios.post(DEEZY_BOOST_API, {
                    psbt: signedTxHex,
                    fee_rate: sendFeeRate,
                });

                if (window.webln) {
                    if (!window.webln.enabled) await window.webln.enable();
                    result = await window.webln.sendPayment(data.bolt11_invoice);
                    toast.success(`Transaction sent: ${result.paymentHash}, copied to clipboard`);
                } else {
                    result = data.bolt11_invoice;
                    toast.success(
                        `Please pay the following LN invoice to complete your payment: ${result}, copied to clipboard`
                    );
                }
                // There is no confirmation modal to show since there is no tx id. Just close the modal
                closeModal();
            } catch (e) {
                toast.error(e.message);
            } finally {
                setIsSending(false);
            }
            return;
        }

        try {
            const txId = await signAndBroadcastUtxo({
                pubKey: nostrPublicKey,
                utxo,
                destinationBtcAddress,
                sendFeeRate,
            });

            setSentTxId(txId);
            toast.success(`Transaction sent: ${txId}, copied to clipboard`);
            navigator.clipboard.writeText(txId);

            // Display confirmation component
            setIsMounted(!isMounted);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsSending(false);
        }
    };

    const renderBody = () => {
        if (!showDiv) {
            return (
                <div className="show-animated">
                    <TransactionSent txId={sentTxId} onClose={closeModal} title="Transaction Sent" />
                </div>
            );
        }

        return (
            <div className={clsx(!isMounted && "hide-animated")}>
                <p>You are about to send this {utxo.inscriptionId ? "ordinal" : "UTXO"}</p>
                <div className="inscription-preview">
                    <InscriptionPreview utxo={utxo} />
                </div>

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
                                        That is not a valid {TESTNET ? "testnet" : "mainnet"} BTC address
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
                                {!!destinationBtcAddress && <span>{shortenStr(destinationBtcAddress)}</span>}
                                <span>{sendFeeRate} sat/vbyte</span>
                                <span>
                                    {boostRequired
                                        ? BOOST_UTXO_VALUE
                                        : utxo && sendFeeRate && outputValue(utxo, sendFeeRate)}{" "}
                                    sats
                                </span>
                            </div>
                        </div>
                        {boostRequired && (
                            <span>
                                Sending will require a small lightning payment to boost the utxo value
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
        <Modal className="rn-popup-modal placebid-modal-wrapper" show={show} onHide={handleModal} centered>
            {show && (
                <button type="button" className="btn-close" aria-label="Close" onClick={handleModal}>
                    <i className="feather-x" />
                </button>
            )}
            {showDiv && (
                <Modal.Header>
                    <h3 className={clsx("modal-title", !isMounted && "hide-animated")}>
                        Send {shortenStr(utxo && `${utxo.txid}:${utxo.vout}`)}
                    </h3>
                </Modal.Header>
            )}
            <Modal.Body>{renderBody()}</Modal.Body>
        </Modal>
    );
};

SendModal.propTypes = {
    show: PropTypes.bool.isRequired,
    handleModal: PropTypes.func.isRequired,
    utxo: PropTypes.object,
    onSale: PropTypes.func.isRequired,
};

export default SendModal;
