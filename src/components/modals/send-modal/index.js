/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { TESTNET, DEFAULT_FEE_RATE } from "@lib/constants";
import { shortenStr, outputValue } from "@utils/crypto";
import { createAndSignPsbtForBoost, signAndBroadcastUtxo } from "@utils/psbt";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import axios from "axios";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";

bitcoin.initEccLib(ecc);
const MIN_OUTPUT_VALUE = 600;

const SendModal = ({ show, handleModal, utxo, onSale }) => {
    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [destinationBtcAddress, setDestinationBtcAddress] = useState("");
    const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
    const [sentTxid, setSentTxid] = useState(null);
    const [nostrPublicKey, setNostrPublicKey] = useState();
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const pubKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);
        if (pubKey) {
            setNostrPublicKey(pubKey);
        }
    }, []);

    async function sendUtxo(boost = false) {
        if (boost) {
            try {
                if (!window.webln) {
                    alert(
                        "Oops looks like you don't have a WebLN compatible browser-extension wallet to make the lightning payment. Try getting Alby from getalby.com"
                    );
                    return;
                }
                if (!window.webln.enabled) await window.webln.enable();

                const signedTxHex = await createAndSignPsbtForBoost({
                    pubKey: nostrPublicKey,
                    utxo,
                    destinationBtcAddress,
                });
                const { data } = await axios.post(`https://api${TESTNET ? "-testnet" : ""}.deezy.io/v1/boost`, {
                    psbt: signedTxHex,
                    fee_rate: sendFeeRate,
                });
                console.log(data);
                const result = await window.webln.sendPayment(data.bolt11_invoice);
                console.log(result);
            } catch (err) {
                console.error(err);
                alert("something went wrong");
                return;
            }

            toast.success(`Payment sent!`);
            handleModal();
            return;
        }
        try {
            const txId = await signAndBroadcastUtxo({
                pubKey: nostrPublicKey,
                utxo,
                destinationBtcAddress,
                sendFeeRate,
            });

            setSentTxid(txId);

            toast.success(`Transaction sent: ${txId}, copied to clipboard`);
            navigator.clipboard.writeText(txId);
            handleModal();
            return true;
        } catch (err) {
            console.error(err);
            toast.error(err);
            return null;
        }
    }

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

    const submit = async () => {
        setIsSending(true);
        await sendUtxo(boostRequired).catch((err) => {
            console.error(err);
            alert(err);
            return false;
        });

        // sleep for 1 second to let the tx propagate
        await new Promise((r) => {
            setTimeout(r, 1000);
        });
        onSale();

        setIsSending(false);
    };

    return (
        <Modal className="rn-popup-modal placebid-modal-wrapper" show={show} onHide={handleModal} centered>
            {show && (
                <button type="button" className="btn-close" aria-label="Close" onClick={handleModal}>
                    <i className="feather-x" />
                </button>
            )}
            <Modal.Header>
                <h3 className="modal-title">Send {shortenStr(utxo && `${utxo.txid}:${utxo.vout}`)}</h3>
            </Modal.Header>
            <Modal.Body>
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
                                        max="100"
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
                                    {boostRequired ? 10000 : utxo && sendFeeRate && outputValue(utxo, sendFeeRate)} sats
                                </span>
                            </div>
                        </div>
                        {boostRequired ? (
                            <span>
                                Sending will require a small lightning payment to boost the utxo value
                                <br />
                                <br />
                            </span>
                        ) : (
                            <></>
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
            </Modal.Body>
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
