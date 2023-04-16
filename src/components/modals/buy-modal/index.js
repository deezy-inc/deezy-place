/* eslint-disable react/forbid-prop-types */
import { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { TESTNET } from "@lib/constants.config";
import { shortenStr } from "@utils/crypto";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import WalletContext from "@context/wallet-context";
import { getAvailableUtxosWithoutInscription } from "@utils/openOrdex";
import { TailSpin } from "react-loading-icons";
import { generatePSBTListingInscriptionForBuy } from "@utils/psbt";
import { toast } from "react-toastify";
import { InscriptionPreview } from "@components/inscription-preview";
import { NostrEvenType } from "@utils/types";

bitcoin.initEccLib(ecc);

const BuyModal = ({ show, handleModal, utxo, onSale, nostr }) => {
    const { nostrAddress, nostrPublicKey } = useContext(WalletContext);
    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
    const [destinationBtcAddress, setDestinationBtcAddress] = useState(nostrAddress);
    const [ordinalValue, setOrdinalValue] = useState(utxo.value);
    const [isOnBuy, setIsOnBuy] = useState(false);
    const [selectedUtxos, setSelectedUtxos] = useState([]);
    const [dummyUtxo, setDummyUtxo] = useState(null);

    // let openOrderx;

    // const createDummyUtxo = async () => {
    //     try {
    //         const txId = await openOrderx.generatePSBTGeneratingDummyUtxos(destinationBtcAddress);
    //         toast.info(`Transaction created. Please wait for it to be confirmed. TxId: ${txId}`);
    //     } catch (e) {
    //         toast.error(e.message);
    //     }
    // };

    const updatePayerAddress = async (address) => {
        try {
            debugger;
            const { selectedUtxos, dummyUtxo } = await getAvailableUtxosWithoutInscription({
                address,
                price: utxo.value,
            });

            if (!dummyUtxo) {
                throw new Error("No dummy UTXO found. Please create one first.");
            }

            setSelectedUtxos(selectedUtxos);
            setDummyUtxo(dummyUtxo);
        } catch (e) {
            setSelectedUtxos([]);
            throw e;
        }
    };

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

    useEffect(() => {
        setDestinationBtcAddress(nostrAddress);

        const updateAddress = async () => {
            setIsOnBuy(true);
            try {
                await updatePayerAddress(nostrAddress);
            } catch (e) {
                setIsBtcInputAddressValid(false);
                toast.error(e.message);
                return; 
            }

            setIsOnBuy(false);
        };

        updateAddress();
    }, [nostrAddress]);

    const buy = async () => {
        setIsOnBuy(true);

        debugger;
        try {
            await updatePayerAddress(destinationBtcAddress);
        } catch (e) {
            setIsBtcInputAddressValid(false);
            toast.error(e.message);
            return;
        }

        try {
            debugger;
            const signedSellerPsbt = bitcoin.Psbt.fromBase64(nostr.content);

            await generatePSBTListingInscriptionForBuy({
                destinationBtcAddress,
                price: nostr.value,
                dummyUtxo,
                pubKey: nostrPublicKey,
                signedSellerPsbt,
            });
            // const psbt = nostr.content;
            // const signedPsbt = await signPsbtMessage(psbt);
            // const txId = broadcastPsbt(signedPsbt);
            // toast.info(`Transaction created. Please wait for it to be confirmed. TxId: ${txId}`);

            // Sign and send
            setIsOnBuy(false);
            onSale();

            handleModal();
        } catch (e) {
            toast.error(e.message);
            return;
        }
    };

    const submit = async () => {
        if (!destinationBtcAddress) return;
        if (!isBtcAmountValid) return;
        if (!isBtcInputAddressValid) return;

        await buy();
    };

    return (
        <Modal className="rn-popup-modal placebid-modal-wrapper" show={show} onHide={handleModal} centered>
            {show && (
                <button type="button" className="btn-close" aria-label="Close" onClick={handleModal}>
                    <i className="feather-x" />
                </button>
            )}
            <Modal.Header>
                <h3 className="modal-title">Buy {shortenStr(utxo && `${utxo.inscriptionId}`)}</h3>
            </Modal.Header>
            <Modal.Body>
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
                                        No dummy UTXOs found for your address
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </div>
                        </div>

                        <div className="bid-content-mid">
                            <div className="bid-content-left">
                                {Boolean(destinationBtcAddress) && <span>Payment Receive Address</span>}

                                {Boolean(utxo.usdPrice) && <span>Price</span>}
                            </div>
                            <div className="bid-content-right">
                                {Boolean(destinationBtcAddress) && <span>{shortenStr(destinationBtcAddress)}</span>}

                                {Boolean(utxo.usdPrice) && <span>{utxo.usdPrice}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bit-continue-button notDummy">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress}
                            autoFocus
                            className={isOnBuy ? "btn-loading" : ""}
                            onClick={submit}
                        >
                            {isOnBuy ? <TailSpin stroke="#fec823" speed={0.75} /> : "Buy"}
                        </Button>
                    </div>
                </div>
            </Modal.Body>
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
