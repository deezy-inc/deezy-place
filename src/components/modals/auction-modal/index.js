/* eslint-disable */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import dynamic from "next/dynamic";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { useWallet } from "@context/wallet-context";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import DatePicker from "react-datepicker";
import { useMemo } from "react";
import { duration } from "@utils/time";

import {
    generatePSBTListingInscriptionForSale,
    signPsbtMessage,
    shortenStr,
    fetchBitcoinPrice,
    TESTNET,
    satsToFormattedDollarString,
    createAuction,
    fetchBlockAverage,
} from "@services/nosft";

bitcoin.initEccLib(ecc);

const _TIME_OPTIONS_IDS = {
    Every10Minutes: "Every10Minutes",
    EveryHour: "EveryHour",
    EveryDay: "EveryDay",
    Custom: "Custom",
};

const _TIME_OPTIONS_LABELS = {
    [_TIME_OPTIONS_IDS.Every10Minutes]: "Every 10 minutes",
    [_TIME_OPTIONS_IDS.EveryHour]: "Every hour",
    [_TIME_OPTIONS_IDS.EveryDay]: "Each day",
    [_TIME_OPTIONS_IDS.Custom]: "Custom",
};

const _TIME_OPTIONS_VALUES = {
    [_TIME_OPTIONS_IDS.Every10Minutes]: duration.minutes(10),
    [_TIME_OPTIONS_IDS.EveryHour]: duration.hours(1),
    [_TIME_OPTIONS_IDS.EveryDay]: duration.days(1),
    [_TIME_OPTIONS_IDS.Custom]: duration.days(1),
};

const RoundOptions = ({ selectedOption, onChange, blockAverage }) => {
    const handleCheckboxChange = (option) => {
        onChange(option);
    };

    const getLabel = (id) => {
        if (!blockAverage) {
            return _TIME_OPTIONS_LABELS[id];
        }

        const blocks = _TIME_OPTIONS_VALUES[id] / blockAverage;
        return `${_TIME_OPTIONS_LABELS[id]} ~ ${Math.round(blocks)} blocks`;
    };

    return (
        <div className="decrease-interval-options">
            <Form.Check
                type="radio"
                id={_TIME_OPTIONS_IDS.Every10Minutes}
                label={getLabel(_TIME_OPTIONS_IDS.Every10Minutes)}
                checked={selectedOption === _TIME_OPTIONS_IDS.Every10Minutes}
                onChange={() => handleCheckboxChange(_TIME_OPTIONS_IDS.Every10Minutes)}
                className="d-inline"
            />
            <Form.Check
                type="radio"
                id={_TIME_OPTIONS_IDS.EveryHour}
                label={getLabel(_TIME_OPTIONS_IDS.EveryHour)}
                checked={selectedOption === _TIME_OPTIONS_IDS.EveryHour}
                onChange={() => handleCheckboxChange(_TIME_OPTIONS_IDS.EveryHour)}
                className="d-inline"
            />
            <Form.Check
                type="radio"
                id={_TIME_OPTIONS_IDS.EveryDay}
                label={getLabel(_TIME_OPTIONS_IDS.EveryDay)}
                checked={selectedOption === _TIME_OPTIONS_IDS.EveryDay}
                onChange={() => handleCheckboxChange(_TIME_OPTIONS_IDS.EveryDay)}
                className="d-inline"
            />
            <Form.Check
                type="radio"
                id={_TIME_OPTIONS_IDS.Custom}
                label={_TIME_OPTIONS_LABELS[_TIME_OPTIONS_IDS.Custom]}
                checked={selectedOption === _TIME_OPTIONS_IDS.Custom}
                onChange={() => handleCheckboxChange(_TIME_OPTIONS_IDS.Custom)}
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
    if (!_TIME_OPTIONS_VALUES[selectedOption]) {
        console.log("Invalid option");
    } else {
        const timeStep = _TIME_OPTIONS_VALUES[selectedOption];
        while (remainingValue > reservePrice) {
            remainingValue -= decreaseAmount;
            time += timeStep;
            pushResult(time, remainingValue);
        }
    }

    return results;
}

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
    const [priceDecreases, setPriceDecreases] = useState(1);
    const [isLowerPriceInvalid, setIsLowerPriceInvalid] = useState(false);
    const [step, setStep] = useState(0);
    const [startDate, setStartDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // Add 5 minutes to the start date
    const [selectedOption, setSelectedOption] = useState(_TIME_OPTIONS_IDS.Every10Minutes);
    const [signedEvents, setSignedEvents] = useState(0);
    const [blockAverage, setBlockAverage] = useState(0);
    const [blocksDecrease, setBlocksDecrease] = useState(144);

    const schedule = useMemo(() => {
        return calculateExpectedPrices({ ordinalValue, decreaseAmount, selectedOption, reservePrice, startDate });
    }, [ordinalValue, decreaseAmount, selectedOption, reservePrice, startDate]);

    const CountdownTimerText = dynamic(() => import("@components/countdown-timer/countdown-timer-text"), {
        ssr: false,
    });

    const timeBetweenEachDecrease = useMemo(() => {
        if (_TIME_OPTIONS_VALUES[selectedOption]) {
            return _TIME_OPTIONS_VALUES[selectedOption];
        }

        // By default uses one day
        return duration.days(1);
    }, [selectedOption]);

    const handleOptionChange = (option) => {
        setSelectedOption(option);
    };

    useEffect(() => {
        const getPrice = async () => {
            const btcPrice = await fetchBitcoinPrice();
            setBitcoinPrice(btcPrice);
        };

        const getBlockAverage = async () => {
            const blockAverage = await fetchBlockAverage();
            if (blockAverage) {
                setBlockAverage(Number(blockAverage));
            }
        };

        setDestinationBtcAddress(nostrAddress);

        getBlockAverage();
        getPrice();
    }, [nostrAddress]);

    const createEvents = async ({ schedule, utxo, destinationBtcAddress }) => {
        let events = [];
        try {
            setSignedEvents(0);
            for (const event of schedule) {
                const { price, ...props } = event;
                const psbt = await generatePSBTListingInscriptionForSale({
                    utxo,
                    paymentAddress: destinationBtcAddress,
                    price,
                });
                const signedPsbt = await signPsbtMessage(psbt);
                events.push({ ...props, price, signedPsbt: signedPsbt.toBase64() });
                setSignedEvents(signedEvents + 1);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
        return events;
    };

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

        if (step === 1) {
            setStep(2);
            return;
        }

        setStep(3);
        await startAuction();
    };

    const priceOnChange = (evt) => {
        const newValue = evt.target.value;
        if (!newValue) {
            setOrdinalValue(0);
            return;
        }

        setOrdinalValue(Number(newValue));
    };

    const minPriceOnChange = (evt) => {
        const newValue = evt.target.value;
        if (!newValue) {
            setIsLowerPriceInvalid(false);
            setReservePrice(0);
            return;
        }

        if (reservePrice > ordinalValue) {
            setIsLowerPriceInvalid(true);
            return;
        }

        setIsLowerPriceInvalid(false);
        setReservePrice(Number(newValue));
    };

    const feeRateOnChange = (evt) => {
        const decreases = Number(evt.target.value);
        setPriceDecreases(decreases);
        // Calculate the decrease amount between initial and end value
        const decreaseAmount = (Number(ordinalValue) - Number(reservePrice)) / decreases;
        setDecreaseAmount(decreaseAmount);
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

    const customTimeOnChange = (evt) => {
        const newValue = evt.target.value;
        if (!newValue) {
            setBlocksDecrease(144);
            return;
        }

        _TIME_OPTIONS_VALUES.Custom = Number(newValue) * blockAverage;
        setBlocksDecrease(Number(newValue));

        handleOptionChange(_TIME_OPTIONS_VALUES.Custom);
    };

    const action = step === 0 || step === 1 ? "Next" : "Create Auction";

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
                                    </InputGroup>

                                    <InputGroup className="mb-lg-5">
                                        <Form.Label>Lowest price (in Sats)</Form.Label>
                                        <Form.Control
                                            defaultValue={reservePrice}
                                            onChange={minPriceOnChange}
                                            type="number"
                                            placeholder="Price (in Sats)"
                                            aria-label="Price (in Sats)"
                                            aria-describedby="basic-addon2"
                                            isInvalid={isLowerPriceInvalid}
                                            autoFocus
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            <br />
                                            Lowest price must be lower than initial price
                                        </Form.Control.Feedback>
                                    </InputGroup>

                                    <InputGroup className="mb-lg-5">
                                        <Form.Label>Number of price decreases ({priceDecreases})</Form.Label>
                                        <Form.Range
                                            min="1"
                                            max="10"
                                            defaultValue={priceDecreases}
                                            onChange={feeRateOnChange}
                                        />
                                    </InputGroup>
                                </div>
                            </div>

                            <div className="bid-content-mid">
                                <div className="bid-content-left">
                                    {!!destinationBtcAddress && <span>Payment Receive Address</span>}
                                    {Boolean(ordinalValue) && bitcoinPrice && <span>Initial Price</span>}
                                    {Boolean(reservePrice) && bitcoinPrice && <span>Lowest Price</span>}
                                    {decreaseAmount && <span>Decrease Amount</span>}
                                </div>

                                <div className="bid-content-right">
                                    {!!destinationBtcAddress && <span>{shortenStr(destinationBtcAddress)}</span>}
                                    {Boolean(ordinalValue) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(ordinalValue, bitcoinPrice)}`}</span>
                                    )}

                                    {Boolean(reservePrice) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(reservePrice, bitcoinPrice)}`}</span>
                                    )}

                                    {Boolean(decreaseAmount) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(decreaseAmount, bitcoinPrice)}`}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="bid-content">
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

                                    <InputGroup className="mb-lg-5 schedule-options">
                                        <Form.Label>How long between each decrease?</Form.Label>
                                        <RoundOptions
                                            selectedOption={selectedOption}
                                            onChange={handleOptionChange}
                                            blockAverage={blockAverage}
                                        />
                                    </InputGroup>

                                    {selectedOption === _TIME_OPTIONS_IDS.Custom && (
                                        <InputGroup className="mb-lg-5 omg">
                                            <Form.Label>Enter amount of blocks</Form.Label>
                                            <Form.Control
                                                defaultValue={blocksDecrease}
                                                onChange={customTimeOnChange}
                                                placeholder="How many blocks between each decrease?"
                                                aria-label="How many blocks between each decrease?"
                                                aria-describedby="basic-addon2"
                                                type="number"
                                                autoFocus
                                            />
                                        </InputGroup>
                                    )}
                                </div>
                            </div>

                            <div className="bid-content-mid">
                                <div className="bid-content-left">
                                    {!!destinationBtcAddress && <span>Payment Receive Address</span>}
                                    {Boolean(ordinalValue) && bitcoinPrice && <span>Initial Price</span>}
                                    {Boolean(reservePrice) && bitcoinPrice && <span>Lowest Price</span>}
                                    {decreaseAmount && <span>Decrease Amount</span>}
                                    {schedule?.[0]?.scheduledTime && <span>Starts in</span>}
                                </div>

                                <div className="bid-content-right">
                                    {!!destinationBtcAddress && <span>{shortenStr(destinationBtcAddress)}</span>}
                                    {Boolean(ordinalValue) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(ordinalValue, bitcoinPrice)}`}</span>
                                    )}

                                    {Boolean(reservePrice) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(reservePrice, bitcoinPrice)}`}</span>
                                    )}

                                    {Boolean(decreaseAmount) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(decreaseAmount, bitcoinPrice)}`}</span>
                                    )}

                                    {!!schedule?.[0]?.scheduledTime && (
                                        <span>
                                            {
                                                <CountdownTimerText
                                                    className="countdown-text-small"
                                                    date={new Date(schedule[0].scheduledTime * 1000)}
                                                />
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="bid-content">
                            <div className="bid-content-mid">
                                <div className="bid-content-left">
                                    {!!destinationBtcAddress && <span>Payment Receive Address</span>}
                                    {Boolean(ordinalValue) && bitcoinPrice && <span>Initial Price</span>}
                                    {Boolean(reservePrice) && bitcoinPrice && <span>Lowest Price</span>}
                                    {decreaseAmount && <span>Decrease Amount</span>}
                                    {schedule?.[0]?.scheduledTime && <span>Starts in</span>}
                                    <span>Signed Events</span>
                                </div>

                                <div className="bid-content-right">
                                    {!!destinationBtcAddress && <span>{shortenStr(destinationBtcAddress)}</span>}
                                    {Boolean(ordinalValue) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(ordinalValue, bitcoinPrice)}`}</span>
                                    )}

                                    {Boolean(reservePrice) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(reservePrice, bitcoinPrice)}`}</span>
                                    )}

                                    {Boolean(decreaseAmount) && bitcoinPrice && (
                                        <span>{`$${satsToFormattedDollarString(decreaseAmount, bitcoinPrice)}`}</span>
                                    )}

                                    {!!schedule?.[0]?.scheduledTime && (
                                        <span>
                                            {
                                                <CountdownTimerText
                                                    className="countdown-text-small"
                                                    date={new Date(schedule[0].scheduledTime * 1000)}
                                                />
                                            }
                                        </span>
                                    )}

                                    <span>
                                        {signedEvents} / {schedule.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bit-continue-button">
                        <Button
                            size="medium"
                            fullwidth
                            disabled={!destinationBtcAddress || schedule[0].scheduledTime * 1000 < Date.now()}
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
