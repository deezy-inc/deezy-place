/* eslint-disable react/forbid-prop-types */
import { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { TESTNET, ORDINALS_EXPLORER_URL } from "@lib/constants";
import { shortenStr } from "@utils/crypto";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import WalletContext from "@context/wallet-context";
// import {
//     getInscriptionDataById,
//     generatePSBTListingInscriptionForSale,
//     updatePayerAddress,
//     hideDummyUtxoElements,
//     generatePSBTGeneratingDummyUtxos,
//     numberOfDummyUtxosToCreate,
//     paymentUtxos,
//     generatePSBTBuyingInscription,
// } from "@utils/openOrdex";
import { toast } from "react-toastify";

bitcoin.initEccLib(ecc);

const BuyModal = ({ show, handleModal, utxo }) => {
    const { nostrAddress } = useContext(WalletContext);
    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
    const [destinationBtcAddress, setDestinationBtcAddress] =
        useState(nostrAddress);
    const [ordinalValue, setOrdinalValue] = useState(utxo.value);

    useEffect(() => {
        setDestinationBtcAddress(nostrAddress);
    }, [nostrAddress]);

    const buy = async () => {
        // try {
        //     const psbt = await generatePSBTBuyingInscription(
        //         payerAddress,
        //         receiverAddress,
        //         price,
        //         paymentUtxos,
        //         dummyUtxo
        //     );
        //     return psbt;
        // } catch (e) {
        //     return alert(e);
        // }
        // Sign and send
    };

    const onChangeAddress = async (newaddr) => {
        if (newaddr === "") {
            setIsBtcInputAddressValid(true);
            return;
        }

        try {
            // await updatePayerAddress(newaddr);
            setDestinationBtcAddress(newaddr);
        } catch (e) {
            setIsBtcInputAddressValid(false);
            toast.error(e.message);
        }
    };

    // const createDummyUtxo = async () => {
    //     const psbt = await generatePSBTGeneratingDummyUtxos(
    //         destinationBtcAddress,
    //         numberOfDummyUtxosToCreate,
    //         paymentUtxos
    //     );
    //     // TODO: SIGN PSBT
    //     const signedContent = psbt;
    //     try {
    //         // TODO: sign the psbt with window.nostr
    //         console.log(signedContent);
    //         // TODO: broadcast the signed psbt
    //     } catch (e) {
    //         toast.error(e.message);
    //         return;
    //     }
    // };

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
            <Modal.Header>
                <h3 className="modal-title">
                    Buy {shortenStr(utxo && `${utxo.inscriptionId}`)}
                </h3>
            </Modal.Header>
            <Modal.Body>
                <p>You are about to buy this NFT</p>
                <iframe
                    id="preview"
                    sandbox="allow-scripts allow-same-origin"
                    scrolling="no"
                    loading="lazy"
                    title={utxo.inscriptionId}
                    src={`${ORDINALS_EXPLORER_URL}/preview/${utxo.inscriptionId}`}
                />

                <div className="placebid-form-box">
                    <div className="bid-content">
                        <div className="bid-content-top">
                            <div className="bid-content-left">
                                <InputGroup className="mb-lg-5 notDummy">
                                    <Form.Label>
                                        Address to receive payment
                                    </Form.Label>
                                    <Form.Control
                                        defaultValue={nostrAddress}
                                        onChange={async (evt) => {
                                            const newaddr = evt.target.value;

                                            await onChangeAddress(newaddr);
                                        }}
                                        placeholder="Buyer address"
                                        aria-label="Buyer address"
                                        aria-describedby="basic-addon2"
                                        isInvalid={!isBtcInputAddressValid}
                                        autoFocus
                                    />

                                    <Form.Control.Feedback type="invalid">
                                        <br />
                                        No dummy UTXOs found for your address
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </div>
                        </div>

                        <div className="bid-content-mid">
                            <div className="bid-content-left">
                                {Boolean(destinationBtcAddress) && (
                                    <span>Payment Receive Address</span>
                                )}

                                {Boolean(utxo.usdPrice) && <span>Price</span>}
                            </div>
                            <div className="bid-content-right">
                                {Boolean(destinationBtcAddress) && (
                                    <span>
                                        {shortenStr(destinationBtcAddress)}
                                    </span>
                                )}

                                {Boolean(utxo.usdPrice) && (
                                    <span>{utxo.usdPrice}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bit-continue-button notDummy">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress}
                            autoFocus
                            onClick={async () => {
                                if (!destinationBtcAddress) return;
                                if (!isBtcAmountValid) return;
                                if (!isBtcInputAddressValid) return;

                                try {
                                    await onChangeAddress(
                                        destinationBtcAddress
                                    );
                                    const msg = `Are you sure you want to buy this NFT for ${ordinalValue} sats?`;
                                    if (!window.confirm(msg)) return;

                                    await buy();
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                        >
                            Buy
                        </Button>
                    </div>

                    {/* <div className="bit-continue-button dummy">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress}
                            autoFocus
                            onClick={async () => {
                                await createDummyUtxo();
                            }}
                        >
                            Create dummy Utxo
                        </Button>
                    </div> */}
                </div>
            </Modal.Body>
        </Modal>
    );
};

BuyModal.propTypes = {
    show: PropTypes.bool.isRequired,
    handleModal: PropTypes.func.isRequired,
    utxo: PropTypes.object,
};
export default BuyModal;
