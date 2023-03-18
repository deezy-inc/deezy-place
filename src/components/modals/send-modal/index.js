/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { TESTNET, DEFAULT_FEE_RATE } from "@lib/constants";
import { shortenStr, outputValue, getAddressInfo, tweakSigner, connectWallet } from "@utils/crypto";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import BIP32Factory from "bip32";
import { ethers } from "ethers";
import { ECPairFactory } from "ecpair";

const ECPair = ECPairFactory(ecc);

import axios from "axios";

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

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

    function toXOnly(key) {
        return key.length === 33 ? key.slice(1, 33) : key;
    }

    // sign message with first sign transaction
    const TAPROOT_MESSAGE =
        // will switch to nosft.xyz once sends are implemented
        "Sign this message to generate your Bitcoin Taproot key. This key will be used for your generative.xyz transactions.";

    async function sendUtxo() {
        const inputAddressInfo = getAddressInfo(nostrPublicKey);
        const psbt = new bitcoin.Psbt({
            network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
        });
        const { ethereum } = window;
        const ethAddress = ethereum.selectedAddress;
        let publicKey = "";
        let tweakedSigner = "";

        if (ethAddress) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const toSign = `0x${Buffer.from(TAPROOT_MESSAGE).toString("hex")}`;
            const signature = await provider.send("personal_sign", [toSign, ethAddress]);
            const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
            const root = bip32.fromSeed(Buffer.from(seed));
            const defaultPath = "m/86'/0'/0'/0/0";
            const taprootChild = root.derivePath(defaultPath);
            const taprootAddress = bitcoin.payments.p2tr({
                pubkey: toXOnly(taprootChild.publicKey),
            });
            const keyPair = ECPair.fromPrivateKey(taprootChild.privateKey);
            publicKey = taprootAddress.pubkey;
            tweakedSigner = tweakSigner(keyPair);
        } else {
            publicKey = Buffer.from(await window.nostr.getPublicKey(), "hex");
        }

        const inputParams = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                value: utxo.value,
                script: inputAddressInfo.output,
            },
            tapInternalKey: toXOnly(publicKey),
        };
        psbt.addInput(inputParams);
        psbt.addOutput({
            address: destinationBtcAddress,
            value: outputValue(utxo, sendFeeRate),
        });

        if (ethAddress) {
            psbt.signInput(0, tweakedSigner);
        } else {
            const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(
                0,
                [inputAddressInfo.output],
                [utxo.value],
                bitcoin.Transaction.SIGHASH_DEFAULT
            );

            const sig = await window.nostr.signSchnorr(sigHash.toString("hex"));
            psbt.updateInput(0, {
                tapKeySig: serializeTaprootSignature(Buffer.from(sig, "hex")),
            });
        }
        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        const hex = tx.toBuffer().toString("hex");
        const fullTx = bitcoin.Transaction.fromHex(hex);
        const res = await axios.post(`https://mempool.space/api/tx`, hex).catch((err) => {
            console.error(err);
            alert(JSON.stringify(err, null, 2));
            return null;
        });
        if (!res) return false;

        setSentTxid(fullTx.getId());

        toast.success(`Transaction sent: ${fullTx.getId()}`);
        handleModal();
        return true;
    }

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
                                        onChange={(evt) => {
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
                                        }}
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
                                        onChange={(evt) => setSendFeeRate(evt.target.value)}
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
                                <span>{utxo && sendFeeRate && outputValue(utxo, sendFeeRate)} sats</span>
                            </div>
                        </div>
                    </div>

                    <div className="bit-continue-button">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress}
                            className={isSending ? "btn-loading" : ""}
                            onClick={async () => {
                                setIsSending(true);
                                await sendUtxo().catch((err) => {
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
                            }}
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
