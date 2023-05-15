/* eslint-disable react/forbid-prop-types */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { TESTNET, NETWORK, DEFAULT_FEE_RATE } from "@lib/constants.config";
import { shortenStr, satsToFormattedDollarString, fetchBitcoinPrice } from "@utils/crypto";
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
import { buyOrdinalWithLightning } from "@services/deezy";

bitcoin.initEccLib(ecc);

const BuyLightingModal = ({ show, handleModal, utxo, onSale, nostr }) => {
    const { nostrAddress } = useWallet();
    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [isLNInputAddressValid, setIsLNInputAddressValid] = useState(true);
    const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
    const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
    const [destinationBtcAddress, setDestinationBtcAddress] = useState(nostrAddress);
    const [refundLightingAddress, setRefundLightingAddress] = useState("");
    const [ordinalValue, setOrdinalValue] = useState(utxo.value);
    const [isOnBuy, setIsOnBuy] = useState(false);
    const [bitcoinPrice, setBitcoinPrice] = useState();
    const [buyTxId, setBuyTxId] = useState(null);

    const [isMounted, setIsMounted] = useState(true);
    const showDiv = useDelayUnmount(isMounted, 500);

    useEffect(() => {
        const getPrice = async () => {
            const btcPrice = await fetchBitcoinPrice();
            setBitcoinPrice(btcPrice);
        };

        getPrice();
    }, [nostrAddress]);

    const feeRateOnChange = (evt) => setSendFeeRate(evt.target.value);

    const onChangeAddress = async (evt) => {
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

    const onChangeLNAddress = async (evt) => {
        const newaddr = evt.target.value;
        if (newaddr === "") {
            setIsLNInputAddressValid(true);
            return;
        }

        setRefundLightingAddress(newaddr);
    };

    useEffect(() => {
        // const getLnAddress = async function () {
        //     if (window.webln) {
        //         if (!window.webln.enabled) await window.webln.enable();
        //     }
        //     const { paymentRequest } = await window.webln.makeInvoice({
        //         amount: 1000,
        //         defaultMemo: "This invoice will be used to create the receive address for the payment.",
        //     });
        //     setRefundLightingAddress(paymentRequest);
        // };

        // getLnAddress();
        setDestinationBtcAddress(nostrAddress);
    }, [nostrAddress]);

    const closeModal = () => {
        onSale();
        handleModal();
    };

    const buy = async () => {
        setIsOnBuy(true);

        try {
            const sellerSignedPsbt = bitcoin.Psbt.fromBase64(nostr.content, { network: NETWORK });

            const bolt11_invoice = await buyOrdinalWithLightning({
                psbt: sellerSignedPsbt.toBase64(),
                receive_address: destinationBtcAddress,
                on_chain_fee_rate: sendFeeRate,
                refund_lightning_address: refundLightingAddress,
            });

            if (window.webln) {
                if (!window.webln.enabled) await window.webln.enable();
                const result = await window.webln.sendPayment(bolt11_invoice);
                toast.success(`Transaction sent: ${result.paymentHash}, copied to clipboard`);

                navigator.clipboard.writeText(result.paymentHash);
            } else {
                navigator.clipboard.writeText(bolt11_invoice);
                toast.success(
                    `Please pay the following LN invoice to complete your payment: ${bolt11_invoice}, copied to clipboard`
                );
            }

            closeModal();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsOnBuy(false);
        }
    };

    const submit = async () => {
        if (!destinationBtcAddress) return;
        if (!isBtcAmountValid) return;
        if (!isBtcInputAddressValid) return;

        await buy();
    };

    const renderBody = () => {
        if (!showDiv) {
            return (
                <div className="show-animated">
                    <TransactionSent txId={buyTxId} onClose={closeModal} title="Transaction Sent" />
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
                                    <Form.Label>Address to receive payment</Form.Label>
                                    <Form.Control
                                        defaultValue={nostrAddress}
                                        onChange={onChangeAddress}
                                        placeholder="Buyer address"
                                        aria-label="Buyer address"
                                        aria-describedby="basic-addon2"
                                        isInvalid={!isBtcInputAddressValid}
                                        autoFocus
                                    />

                                    <Form.Control.Feedback type="invalid">
                                        <br />
                                        That is not a valid {TESTNET ? "testnet" : "mainnet"} BTC address
                                    </Form.Control.Feedback>
                                </InputGroup>

                                <InputGroup className="mb-lg-5 notDummy">
                                    <Form.Label>Refund LN Address</Form.Label>
                                    <Form.Control
                                        defaultValue={refundLightingAddress}
                                        onChange={onChangeLNAddress}
                                        placeholder="Refund lighting address"
                                        aria-label="Refund lighting address"
                                        aria-describedby="basic-addon2"
                                        isInvalid={!isLNInputAddressValid}
                                    />

                                    <Form.Control.Feedback type="invalid">
                                        <br />
                                        That is not a valid Lighting Address
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
                                {Boolean(destinationBtcAddress) && <span>Payment Receive Address</span>}
                                {Boolean(refundLightingAddress) && <span>Refund Lighting Address</span>}

                                {Boolean(nostr.value) && <span>Price</span>}
                                <span>Fee rate</span>
                            </div>
                            <div className="bid-constent-right">
                                {Boolean(destinationBtcAddress) && <span>{shortenStr(destinationBtcAddress)}</span>}
                                {Boolean(refundLightingAddress) && <span>{shortenStr(refundLightingAddress)}</span>}
                                {Boolean(nostr.value) && bitcoinPrice && (
                                    <span>{`$${satsToFormattedDollarString(nostr.value, bitcoinPrice)}`}</span>
                                )}
                                <span>{sendFeeRate} sat/vbyte</span>
                            </div>
                        </div>
                    </div>

                    <div className="bit-continue-button notDummy">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress || !refundLightingAddress}
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
        <Modal className="rn-popup-modal placebid-modal-wrapper" show={show} onHide={handleModal} centered>
            {show && (
                <button type="button" className="btn-close" aria-label="Close" onClick={handleModal}>
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

BuyLightingModal.propTypes = {
    show: PropTypes.bool.isRequired,
    handleModal: PropTypes.func.isRequired,
    utxo: PropTypes.object,
    onSale: PropTypes.func,
    nostr: NostrEvenType,
};
export default BuyLightingModal;
