/* eslint-disable */
import { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { TESTNET, NOSTR_SELL_KIND_INSCRIPTION } from "@lib/constants.config";
import { shortenStr, fetchBitcoinPrice, satsToFormattedDollarString } from "@utils/crypto";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import WalletContext from "@context/wallet-context";
import { OpenOrdex } from "@utils/openOrdex";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { nostrPool } from "@services/nostr-relay";
import { InscriptionPreview } from "@components/inscription-preview";

bitcoin.initEccLib(ecc);

const SendModal = ({ show, handleModal, utxo }) => {
    const { nostrAddress, nostrPublicKey } = useContext(WalletContext);

    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
    const [destinationBtcAddress, setDestinationBtcAddress] = useState(nostrAddress);
    const [ordinalValue, setOrdinalValue] = useState(utxo.value);
    const [bitcoinPrice, setBitcoinPrice] = useState();
    const [isOnSale, setIsOnSale] = useState(false);

    let openOrderx;

    useEffect(() => {
        const getPrice = async () => {
            const btcPrice = await fetchBitcoinPrice();
            setBitcoinPrice(btcPrice);
        };

        getPrice();
    }, []);

    const sale = async () => {
        setIsOnSale(true);
        if (!openOrderx) {
            openOrderx = await OpenOrdex.init();
        }

        const inscription = await openOrderx.getInscriptionDataById(utxo.inscriptionId);
        const { inscriptionId } = utxo;
        const signedPsbt = await openOrderx.generatePSBTListingInscriptionForSale(
            inscription.output,
            ordinalValue,
            destinationBtcAddress
        );

        try {
            await openOrderx.submitSignedSalePsbt(utxo, ordinalValue, signedPsbt);
            toast.info("Ordinal is now on sale");
        } catch (e) {
            toast.error(e.message);
        }
        const event = {
            pubkey: nostrPublicKey,
            kind: NOSTR_SELL_KIND_INSCRIPTION,
            tags: [["i", inscriptionId, signedPsbt]], // TODO: what is signedContent?
            content: `sell ${inscriptionId}`,
        };
        const signedEvent = await nostrPool.sign(event);
        nostrPool.publish(signedEvent, console.info, console.error); // TODO: it is falling

        setIsOnSale(false);
        handleModal();
    };

    const submit = async () => {
        if (!destinationBtcAddress) return;
        if (!isBtcAmountValid) return;
        if (!isBtcInputAddressValid) return;
        const msg = `Are you sure you want to sell this ordinal for ${ordinalValue} sats?`;
        if (!window.confirm(msg)) return;

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
        <Modal className="rn-popup-modal placebid-modal-wrapper" show={show} onHide={handleModal} centered>
            {show && (
                <button type="button" className="btn-close" aria-label="Close" onClick={handleModal}>
                    <i className="feather-x" />
                </button>
            )}
            <Modal.Header>
                <h3 className="modal-title">Sell {shortenStr(utxo && `${utxo.inscriptionId}`)}</h3>
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
                                        defaultValue={nostrAddress}
                                        onChange={addressOnChange}
                                        placeholder="Paste BTC address to receive your payment here"
                                        aria-label="Paste BTC address to receive your payment here"
                                        aria-describedby="basic-addon2"
                                        isInvalid={!isBtcInputAddressValid}
                                        autoFocus
                                    />

                                    <Form.Control.Feedback type="invalid">
                                        <br />
                                        That is not a valid {TESTNET ? "testnet" : "mainnet"} BTC address
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
                                {!!destinationBtcAddress && <span>Payment Receive Address</span>}
                                {Boolean(ordinalValue) && bitcoinPrice && <span>Price</span>}
                            </div>
                            <div className="bid-content-right">
                                {!!destinationBtcAddress && <span>{shortenStr(destinationBtcAddress)}</span>}

                                {Boolean(ordinalValue) && bitcoinPrice && (
                                    <span>{`$${satsToFormattedDollarString(ordinalValue, bitcoinPrice)}`}</span>
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
                            {isOnSale ? <TailSpin stroke="#fec823" speed={0.75} /> : "Sale"}
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
    onSale: PropTypes.func,
};
export default SendModal;
