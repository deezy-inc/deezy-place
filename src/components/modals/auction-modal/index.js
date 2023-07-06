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
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { useMemo } from "react";
import { duration } from "@utils/time";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
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
import { useCounter } from "react-use";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";

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

function calculateExpectedPrices({
  ordinalValue: initialOrdinalPrice,
  decreaseAmount,
  selectedOption,
  reservePrice,
  startDate,
}) {
  const startTime = startDate.getTime();
  const results = [];
  const timeStep = _TIME_OPTIONS_VALUES[selectedOption];

  if (!timeStep) {
    console.log("Invalid option");
    return results;
  }

  for (
    let time = 0, remainingAmount = initialOrdinalPrice;
    remainingAmount >= reservePrice;
    time += timeStep
  ) {
    results.push({
      scheduledTime: startTime + time,
      price: remainingAmount,
    });

    if (remainingAmount === reservePrice) {
      break;
    }

    remainingAmount = Math.max(remainingAmount - decreaseAmount, reservePrice);
  }

  return results;
}

const maxAuctionStartingDate = new Date();
maxAuctionStartingDate.setDate(maxAuctionStartingDate.getDate() + 7);

const auctionStartingTime = new Date();
auctionStartingTime.setMinutes(auctionStartingTime.getMinutes() + 10);
auctionStartingTime.setMinutes(
  Math.ceil(auctionStartingTime.getMinutes() / 10) * 10
);

const AuctionModal = ({ show, handleModal, utxo, onSale, isSpent }) => {
  const { nostrOrdinalsAddress, nostrPaymentsAddress, ordinalsPublicKey } =
    useWallet();

  const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
  const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
  const [destinationBtcAddress, setDestinationBtcAddress] =
    useState(nostrPaymentsAddress);
  const [ordinalValue, setOrdinalValue] = useState(utxo.value);
  const [reservePrice, setReservePrice] = useState(Math.round(utxo.value / 2));
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });
  const [isOnSale, setIsOnSale] = useState(false);
  const [priceDecreases, setPriceDecreases] = useState(1);
  const [isLowerPriceInvalid, setIsLowerPriceInvalid] = useState(false);
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState(auctionStartingTime);
  const [selectedOption, setSelectedOption] = useState(
    _TIME_OPTIONS_IDS.Every10Minutes
  );
  const [signedEventsCounter, { inc: incCounter, reset: resetCounter }] =
    useCounter(0);
  const [blockAverage, setBlockAverage] = useState(0);
  const [blocksDecrease, setBlocksDecrease] = useState(144);
  const [startingDate, setStartingDate] = useState(new Date());
  const [startingTime, setStartingTime] = useState(auctionStartingTime);

  const decreaseAmount = useMemo(() => {
    const defaultAmount = Math.round(utxo.value / 2);
    return priceDecreases > 0 && ordinalValue > 0 && reservePrice > 0
      ? Math.floor((ordinalValue - reservePrice) / priceDecreases)
      : defaultAmount;
  }, [priceDecreases, utxo.value, ordinalValue, reservePrice]);

  const auctionSchedule = useMemo(() => {
    return calculateExpectedPrices({
      ordinalValue,
      decreaseAmount,
      selectedOption,
      reservePrice,
      startDate,
    });
  }, [ordinalValue, decreaseAmount, selectedOption, reservePrice, startDate]);

  const validAuction =
    ordinalValue > 0 &&
    ordinalValue > reservePrice &&
    destinationBtcAddress &&
    !isLowerPriceInvalid &&
    decreaseAmount > 0;

  const CountdownTimerText = dynamic(
    () => import("@components/countdown-timer/countdown-timer-text"),
    {
      ssr: false,
    }
  );

  const secondsBetweenEachDecrease = useMemo(() => {
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
    const getBlockAverage = async () => {
      const blockAverage = await fetchBlockAverage();
      if (blockAverage) {
        setBlockAverage(Number(blockAverage));
      }
    };

    setDestinationBtcAddress(nostrPaymentsAddress);

    getBlockAverage();
  }, [nostrPaymentsAddress]);

  const createEvents = async ({
    auctionSchedule,
    utxo,
    destinationBtcAddress,
  }) => {
    let events = [];
    try {
      resetCounter();
      const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);

      for (const event of auctionSchedule) {
        const { price, ...props } = event;
        const psbt = await generatePSBTListingInscriptionForSale({
          utxo,
          paymentAddress: destinationBtcAddress,
          price,
          pubkey: ordinalsPublicKey,
        });

        let signedPsbt;
        if (provider === "unisat.io") {
          signedPsbt = await window.unisat.signPsbt(psbt.toHex());
        } else {
          signedPsbt = await signPsbtMessage(
            psbt.toBase64(),
            nostrOrdinalsAddress
          );
          signedPsbt = signedPsbt.toBase64();
        }

        events.push({ ...props, price, signedPsbt });
        incCounter();
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
      if (isSpent) {
        toast.error("The UTXO is already spent. Please, select another one.");
        handleModal();
        return;
      }

      const newSchedule = await createEvents({
        auctionSchedule,
        utxo,
        destinationBtcAddress,
        ordinalsPublicKey,
      });

      const dutchAuction = {
        startTime: startDate.getTime(),
        decreaseAmount,
        secondsBetweenEachDecrease,
        initialPrice: ordinalValue,
        reservePrice,
        metadata: newSchedule,
        btcAddress: nostrOrdinalsAddress,
        output: utxo.output || `${utxo.txid}:${utxo.vout}`, // TODO: should I need it?
        inscriptionId: utxo.inscriptionId,
      };
      const auction = await createAuction(dutchAuction);
      console.log({ auction });
      toast.info(`Order successfully scheduled to be published to Nostr!`);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
      setIsOnSale(false);
    }
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
    const newValue = Number(evt.target.value);
    if (!newValue) {
      setOrdinalValue(0);
      return;
    }

    setOrdinalValue(Number(newValue));
  };

  const minPriceOnChange = (evt) => {
    const newValue = Number(evt.target.value);
    if (!newValue) {
      setIsLowerPriceInvalid(false);
      setReservePrice(0);
      return;
    }

    if (newValue > ordinalValue) {
      setIsLowerPriceInvalid(true);
      return;
    }

    setIsLowerPriceInvalid(false);
    setReservePrice(newValue);
  };

  const priceDecreaseOnChange = (evt) => {
    const decreases = Number(evt.target.value);
    if (decreases < 1) {
      return;
    }
    setPriceDecreases(decreases);
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
          Sell {shortenStr(utxo && `${utxo.inscriptionId}`)}
        </h3>
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
                      defaultValue={nostrPaymentsAddress}
                      onChange={addressOnChange}
                      placeholder="Paste BTC address to receive your payment here"
                      aria-label="Paste BTC address to receive your payment here"
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
                </div>
              </div>

              <div className="bid-content-mid">
                <div className="bid-content-left">
                  {!!destinationBtcAddress && (
                    <span>Payment Receive Address</span>
                  )}
                </div>
                <div className="bid-content-right">
                  {!!destinationBtcAddress && (
                    <span>{shortenStr(destinationBtcAddress)}</span>
                  )}
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
                      isInvalid={isLowerPriceInvalid}
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
                    <Form.Label>
                      Number of price decreases ({priceDecreases})
                    </Form.Label>
                    <Form.Range
                      min="1"
                      max="10"
                      defaultValue={priceDecreases}
                      onChange={priceDecreaseOnChange}
                    />
                  </InputGroup>
                </div>
              </div>

              <div className="bid-content-mid">
                <div className="bid-content-left">
                  {!!destinationBtcAddress && (
                    <span>Payment Receive Address</span>
                  )}
                  {Boolean(ordinalValue) && bitcoinPrice && (
                    <span>Initial Price</span>
                  )}
                  {Boolean(reservePrice) && bitcoinPrice && (
                    <span>Lowest Price</span>
                  )}
                  {decreaseAmount > 0 && <span>Decrease Amount</span>}
                </div>

                <div className="bid-content-right">
                  {!!destinationBtcAddress && (
                    <span>{shortenStr(destinationBtcAddress)}</span>
                  )}
                  {Boolean(ordinalValue) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      ordinalValue,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {Boolean(reservePrice) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      reservePrice,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {Boolean(decreaseAmount) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      decreaseAmount,
                      bitcoinPrice
                    )}`}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bid-content">
              <div className="bid-content-top">
                <div className="bid-content-left">
                  <Form.Label>Start Date</Form.Label>
                  <div className="mb-lg-5">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        className="date-picker-custom"
                        onChange={(date) => {
                          // set starting date
                          const updatedDate = dayjs(date).format("YYYY-MM-DD");
                          // set updatedDate to startingDate
                          const updatedDateTime = dayjs(
                            `${updatedDate} ${dayjs(startingTime).format(
                              "HH:mm"
                            )}`,
                            "YYYY-MM-DD HH:mm"
                          );

                          setStartingDate(date);
                          setStartDate(new Date(updatedDateTime));
                        }}
                        defaultValue={dayjs(new Date())}
                        maxDate={dayjs(maxAuctionStartingDate)} // set to one week from now
                        disablePast
                      />
                    </LocalizationProvider>
                  </div>

                  <Form.Label>Start Time</Form.Label>
                  <div className="mb-lg-5">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        className="date-picker-custom"
                        onChange={(date) => {
                          setStartingTime(date);
                          // set starting time
                          const updatedTime = dayjs(date).format("HH:mm");
                          // set updatedTime to startingDate
                          const updatedDate =
                            dayjs(startingDate).format("YYYY-MM-DD");
                          // set updatedDate to startingDate
                          const updatedDateTime = dayjs(
                            `${updatedDate} ${updatedTime}`,
                            "YYYY-MM-DD HH:mm"
                          );

                          setStartDate(new Date(updatedDateTime));
                        }}
                        defaultValue={dayjs(auctionStartingTime)}
                        disablePast
                      />
                    </LocalizationProvider>
                  </div>

                  {/* <DatePicker
                                            selected={startDate}
                                            showTimeSelect
                                            timeInputLabel="Time:"
                                            showTimeInput
                                            timeFormat="HH:mm"
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            onChange={(date) => setStartDate(date)}
                                            minDate={new Date()}
                                            showDisabledMonthNavigation
                                            minTime={new Date()}
                                            maxTime={new Date().setHours(23, 59)}
                                            injectTimes={[startDate]}
                                            timeIntervals={1}
                                        /> */}

                  <div className="mb-lg-5">
                    <Form.Label>How long between each decrease?</Form.Label>
                    <RoundOptions
                      selectedOption={selectedOption}
                      onChange={handleOptionChange}
                      blockAverage={blockAverage}
                    />
                  </div>
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
                  {!!destinationBtcAddress && (
                    <span>Payment Receive Address</span>
                  )}
                  {Boolean(ordinalValue) && bitcoinPrice && (
                    <span>Initial Price</span>
                  )}
                  {Boolean(reservePrice) && bitcoinPrice && (
                    <span>Lowest Price</span>
                  )}
                  {decreaseAmount > 0 && <span>Decrease Amount</span>}
                  {auctionSchedule?.[0]?.scheduledTime && (
                    <span>Starts in</span>
                  )}
                </div>

                <div className="bid-content-right">
                  {!!destinationBtcAddress && (
                    <span>{shortenStr(destinationBtcAddress)}</span>
                  )}
                  {Boolean(ordinalValue) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      ordinalValue,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {Boolean(reservePrice) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      reservePrice,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {Boolean(decreaseAmount) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      decreaseAmount,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {!!auctionSchedule?.[0]?.scheduledTime && (
                    <span>
                      {
                        <CountdownTimerText
                          className="countdown-text-small"
                          time={auctionSchedule[0].scheduledTime}
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
                  {!!destinationBtcAddress && (
                    <span>Payment Receive Address</span>
                  )}
                  {Boolean(ordinalValue) && bitcoinPrice && (
                    <span>Initial Price</span>
                  )}
                  {Boolean(reservePrice) && bitcoinPrice && (
                    <span>Lowest Price</span>
                  )}
                  {decreaseAmount > 0 && <span>Decrease Amount</span>}
                  {auctionSchedule?.[0]?.scheduledTime && (
                    <span>Starts in</span>
                  )}
                  <span>Signed Events</span>
                </div>

                <div className="bid-content-right">
                  {!!destinationBtcAddress && (
                    <span>{shortenStr(destinationBtcAddress)}</span>
                  )}
                  {Boolean(ordinalValue) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      ordinalValue,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {Boolean(reservePrice) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      reservePrice,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {Boolean(decreaseAmount) && bitcoinPrice && (
                    <span>{`$${satsToFormattedDollarString(
                      decreaseAmount,
                      bitcoinPrice
                    )}`}</span>
                  )}

                  {!!auctionSchedule?.[0]?.scheduledTime && (
                    <span>
                      {
                        <CountdownTimerText
                          className="countdown-text-small"
                          time={auctionSchedule[0].scheduledTime}
                        />
                      }
                    </span>
                  )}

                  <span>
                    {signedEventsCounter} / {auctionSchedule.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bit-continue-button">
            <Button
              size="medium"
              fullwidth
              disabled={
                !validAuction ||
                (step > 1 && auctionSchedule[0]?.scheduledTime < Date.now())
              }
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
  isSpent: PropTypes.bool,
};
export default AuctionModal;
