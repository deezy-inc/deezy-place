/* eslint-disable */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { useWallet } from "@context/wallet-context";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";

import { InscriptionPreview } from "@components/inscription-preview";
import DatePicker from "react-datepicker";
import { useMemo } from "react";
import { createAuction } from "@services/auction";

import {
    generatePSBTListingInscriptionForSale,
    signPsbtMessage,
    shortenStr,
    fetchBitcoinPrice,
    TESTNET,
} from "@services/nosft";
bitcoin.initEccLib(ecc);

const RoundOptions = ({ selectedOption, onChange }) => {
    const handleCheckboxChange = (option) => {
        onChange(option);
    };

    return (
        <div>
            <Form.Check
                type="radio"
                id="eachMinute"
                label="Each minute"
                checked={selectedOption === "Each minute"}
                onChange={() => handleCheckboxChange("Each minute")}
                className="d-inline"
            />
            <Form.Check
                type="radio"
                id="eachHour"
                label="Each hour"
                checked={selectedOption === "Each hour"}
                onChange={() => handleCheckboxChange("Each hour")}
                className="d-inline"
            />
            <Form.Check
                type="radio"
                id="eachDay"
                label="Each day"
                checked={selectedOption === "Each day"}
                onChange={() => handleCheckboxChange("Each day")}
                className="d-inline"
            />
        </div>
    );
};

function calculateExpectedPrices({ ordinalValue, decreaseAmount, selectedOption, reservePrice, startDate }) {
    const unixTime = Math.floor(startDate.getTime() / 1000);
    let remainingValue = ordinalValue;
    let time = 0;
    let results = [];

    const pushResult = (time, value) => {
        const scheduledTime = unixTime + time;
        results.push({
            scheduledTime,
            price: Math.max(value, reservePrice),
        });
    };

    pushResult(time, remainingValue, 0); // Start by pushing the initial price

    switch (selectedOption) {
        case "Each minute":
            while (remainingValue > reservePrice) {
                remainingValue -= decreaseAmount;
                time += 60; // Increase time by 60 seconds
                pushResult(time, remainingValue);
            }
            break;
        case "Each hour":
            while (remainingValue > reservePrice) {
                remainingValue -= decreaseAmount;
                time += 3600; // Increase time by 3600 seconds
                pushResult(time, remainingValue);
            }
            break;
        case "Each day":
            while (remainingValue > reservePrice) {
                remainingValue -= decreaseAmount;
                time += 86400; // Increase time by 86400 seconds
                pushResult(time, remainingValue);
            }
            break;
        default:
            console.log("Invalid option");
    }

    return results;
}

// important
const createEvents = async ({ schedule, utxo, destinationBtcAddress }) => {
    let events = [];
    try {
        for (const event of schedule) {
            const { price, ...props } = event;
            const psbt = await generatePSBTListingInscriptionForSale({
                utxo,
                paymentAddress: destinationBtcAddress,
                price,
            });
            const signedPsbt = await signPsbtMessage(psbt);
            events.push({ ...props, price, signedPsbt: signedPsbt.toBase64() });
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
    return events;
};

const AuctionModal = ({ show, handleModal, utxo, onSale }) => {
    const { nostrAddress, nostrPublicKey } = useWallet();

    const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
    const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
    const [destinationBtcAddress, setDestinationBtcAddress] = useState(nostrAddress);
    const [ordinalValue, setOrdinalValue] = useState(utxo.value);
    const [reservePrice, setReservePrice] = useState(Math.round(utxo.value / 2));
    const [bitcoinPrice, setBitcoinPrice] = useState("-");
    const [isOnSale, setIsOnSale] = useState(false);
    const [decreaseAmount, setDecreaseAmount] = useState(Math.round(utxo.value / 2));

    const [step, setStep] = useState(0);
    const [startDate, setStartDate] = useState(new Date(Date.now() + 5 * 60 * 1000)); // Add 5 minutes to the start date
    const [selectedOption, setSelectedOption] = useState("Each minute");

    const schedule = useMemo(() => {
        return calculateExpectedPrices({ ordinalValue, decreaseAmount, selectedOption, reservePrice, startDate });
    }, [ordinalValue, decreaseAmount, selectedOption, reservePrice, startDate]);

    const timeBetweenEachDecrease = useMemo(() => {
        switch (selectedOption) {
            case "Each minute":
                return 60;
            case "Each hour":
                return 3600;
            case "Each day":
                return 86400;
            default:
                return 3600;
        }
    }, [selectedOption]);

    const handleOptionChange = (option) => {
        setSelectedOption(option);
    };

    useEffect(() => {
        const getPrice = async () => {
            const btcPrice = await fetchBitcoinPrice();
            setBitcoinPrice(btcPrice);
        };

        setDestinationBtcAddress(nostrAddress);

        getPrice();
    }, [nostrAddress]);

    const startAuction = async () => {
        setIsOnSale(true);

        try {
            const newSchedule = await createEvents({ schedule, utxo, destinationBtcAddress, nostrPublicKey });
            const unixTime = Math.floor(startDate.getTime() / 1000);
            const dutchAuction = {
                startTime: unixTime,
                decreaseAmount,
                timeBetweenEachDecrease,
                initialPrice: ordinalValue,
                reservePrice,
                metadata: newSchedule,
                nostrAddress,
                output: utxo.output,
                inscriptionId: utxo.inscriptionId,
            };
            console.log(dutchAuction);
            await createAuction(dutchAuction);
            toast.info(`Order successfully scheduled to be published to Nostr!`);
        } catch (e) {
            toast.error(e.message);
        }

        setIsOnSale(false);
        onSale();
        handleModal();
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!destinationBtcAddress) return;
        if (!isBtcAmountValid) return;
        if (!isBtcInputAddressValid) return;

        if (step === 0) {
            setStep(1);
            return;
        }

        await startAuction();
    };

    const priceOnChange = (evt) => {
        const newValue = evt.target.value;
        if (!newValue) {
            return;
        }
        setOrdinalValue(Number(newValue));
    };

    const minPriceOnChange = (evt) => {
        const newValue = evt.target.value;
        if (!newValue) {
            return;
        }
        setReservePrice(Number(newValue));
    };

    const decreaseAmountOnChange = (evt) => {
        const newValue = evt.target.value;
        if (!newValue || newValue === "" || Number(newValue) < 1) {
            return;
        }
        setDecreaseAmount(Number(newValue));
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

    const action = step === 0 ? "Configure" : "Start Auction";

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
                <p>You are about to sell this Ordinal by Dutch Auction</p>

                {step === 0 && (
                    <div className="inscription-preview">
                        <InscriptionPreview utxo={utxo} />
                    </div>
                )}

                <div className="placebid-form-box">
                    {step === 0 && (
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
                                </div>
                            </div>

                            <div className="bid-content-mid">
                                <div className="bid-content-left">
                                    {!!destinationBtcAddress && <span>Payment Receive Address</span>}
                                </div>
                                <div className="bid-content-right">
                                    {!!destinationBtcAddress && <span>{shortenStr(destinationBtcAddress)}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="bid-content">
                            <div className="bid-content-top">
                                <div className="bid-content-left">
                                    <InputGroup className="mb-lg-5">
                                        <Form.Label>Initial price (in Sats)</Form.Label>
                                        <Form.Control
                                            defaultValue={utxo.value}
                                            onChange={priceOnChange}
                                            type="number"
                                            placeholder="Price (in Sats)"
                                            aria-label="Price (in Sats)"
                                            aria-describedby="basic-addon2"
                                            autoFocus
                                        />

                                        <Form.Label>Min price (in Sats)</Form.Label>
                                        <Form.Control
                                            defaultValue={reservePrice}
                                            onChange={minPriceOnChange}
                                            type="number"
                                            placeholder="Price (in Sats)"
                                            aria-label="Price (in Sats)"
                                            aria-describedby="basic-addon2"
                                            autoFocus
                                        />
                                    </InputGroup>

                                    <Form.Label>Decrease by</Form.Label>
                                    <Form.Control
                                        defaultValue={decreaseAmount}
                                        onChange={decreaseAmountOnChange}
                                        type="number"
                                        placeholder="Price (in Sats)"
                                        aria-label="Price (in Sats)"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="bid-content-top">
                                <div className="bid-content-left">
                                    <InputGroup className="mb-lg-5 omg">
                                        <Form.Label>Start time</Form.Label>
                                        <DatePicker
                                            selected={startDate}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            onChange={(date) => setStartDate(date)}
                                            minDate={new Date()}
                                            showDisabledMonthNavigation
                                            minTime={new Date()}
                                            maxTime={new Date().setHours(23, 59)}
                                            injectTimes={[startDate]}
                                        />
                                    </InputGroup>

                                    <InputGroup className="mb-lg-5">
                                        <RoundOptions selectedOption={selectedOption} onChange={handleOptionChange} />
                                    </InputGroup>
                                    <p>
                                        Events: {schedule.length} {"-->"} {JSON.stringify(schedule, null, 2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bit-continue-button">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress}
                            autoFocus
                            className={isOnSale ? "btn-loading" : ""}
                            onClick={submit}
                        >
                            {isOnSale ? <TailSpin stroke="#fec823" speed={0.75} /> : action}
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

AuctionModal.propTypes = {
    show: PropTypes.bool.isRequired,
    handleModal: PropTypes.func.isRequired,
    utxo: PropTypes.object,
    onSale: PropTypes.func,
};
export default AuctionModal;
