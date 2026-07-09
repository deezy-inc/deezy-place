import React, { useState } from "react";
import { InputGroup, Form } from "react-bootstrap";
import Button from "@ui/button";
import { TailSpin } from "react-loading-icons";

import {
    shortenStr,
} from "@services/nosft";

// Small square +/- steppers flanking the fee rate slider
const feeStepButtonStyle = {
    background: "transparent",
    border: "1px solid #a0a0b8",
    borderRadius: "6px",
    color: "#a0a0b8",
    width: "28px",
    height: "28px",
    lineHeight: 1,
    fontSize: "1rem",
    cursor: "pointer",
    flex: "0 0 auto",
    padding: 0,
};

const getTitle = (sendingInscriptions, sendingRunes, sendingRareSats, sendingUtxos) => {
    const parts = [];
    if (sendingInscriptions.length > 0) {
        parts.push(`${sendingInscriptions.length} inscription${sendingInscriptions.length !== 1 ? 's' : ''}`);
    }
    if (sendingRunes.length > 0) {
        parts.push(`${sendingRunes.length} rune${sendingRunes.length !== 1 ? 's' : ''}`);
    }
    if (sendingRareSats.length > 0) {
        parts.push(`${sendingRareSats.length} rare sat${sendingRareSats.length !== 1 ? 's' : ''}`);
    }
    if (sendingUtxos.length > 0) {
        parts.push(`${sendingUtxos.length} cardinal UTXO${sendingUtxos.length !== 1 ? 's' : ''}`);
    }
    if (parts.length === 0) {
        return '';
    }
    const joined = parts.length > 2
        ? `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
        : parts.join(' and ');
    return `You are about to send ${joined}.`;
};

export const SelectRateStep = ({
    destinationBtcAddress,
    isBtcInputAddressValid,
    sendFeeRate,
    addressOnChange,
    feeRateOnChange,
    onFeeRateAdjust,
    preparePsbt,
    isSending,
    sendingInscriptions,
    sendingRunes = [],
    sendingRareSats,
    sendingUtxos,
    stripPaddingAvailable = false,
    stripPadding = false,
    onStripPaddingChange,
    paddingSendTo = "change",
    onPaddingSendToChange,
    paddingTargetSize = 330,
    onPaddingTargetSizeChange,
}) => {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    return (
    <div>
        <p>
            {getTitle(sendingInscriptions, sendingRunes, sendingRareSats, sendingUtxos)}
        </p>
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
                                That is not a valid BTC
                                address
                            </Form.Control.Feedback>
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <Form.Label>Select a fee rate</Form.Label>
                            <div
                                className="d-flex align-items-center w-100"
                                style={{ gap: "12px" }}
                            >
                                <button
                                    type="button"
                                    aria-label="Decrease fee rate"
                                    onClick={() => onFeeRateAdjust(-0.1)}
                                    style={feeStepButtonStyle}
                                >
                                    −
                                </button>
                                <Form.Range
                                    min="0.2"
                                    max="100"
                                    step="0.1"
                                    value={sendFeeRate}
                                    onChange={feeRateOnChange}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    aria-label="Increase fee rate"
                                    onClick={() => onFeeRateAdjust(0.1)}
                                    style={feeStepButtonStyle}
                                >
                                    +
                                </button>
                            </div>
                        </InputGroup>
                    </div>
                </div>
                <div className="bid-content-mid">
                    <div className="bid-content-left">
                        <span>Fee rate</span>
                    </div>
                    <div className="bid-content-right">
                        <span>{sendFeeRate} sat/vbyte</span>
                    </div>
                </div>
                {stripPaddingAvailable && (
                    <div className="mb-5" style={{ marginTop: "-10px" }}>
                        <button
                            type="button"
                            className="btn-transparent"
                            style={{ fontSize: "0.9em", color: "#a0a0b8" }}
                            onClick={() => setAdvancedOpen((prev) => !prev)}
                        >
                            Advanced {advancedOpen ? "▴" : "▾"}
                        </button>
                        {advancedOpen && (
                            <div className="mt-2">
                                <Form.Check
                                    type="checkbox"
                                    id="strip-padding-check"
                                    label="Strip padding"
                                    title="Reduce each inscription / rare sat output to the target size and split the extra padding into its own output"
                                    checked={stripPadding}
                                    onChange={(e) => onStripPaddingChange(e.target.checked)}
                                />
                                {stripPadding && (
                                    <div className="mt-2 ms-4">
                                        <Form.Label className="d-block mb-1">
                                            Padding sent to
                                        </Form.Label>
                                        <Form.Check
                                            inline
                                            type="radio"
                                            id="padding-to-change"
                                            name="padding-send-to"
                                            label="Change"
                                            title="Padding will be sent back to this address"
                                            checked={paddingSendTo === "change"}
                                            onChange={() => onPaddingSendToChange("change")}
                                        />
                                        <Form.Check
                                            inline
                                            type="radio"
                                            id="padding-to-destination"
                                            name="padding-send-to"
                                            label="Destination"
                                            title="Padding will be sent to the same destination you are sending to"
                                            checked={paddingSendTo === "destination"}
                                            onChange={() => onPaddingSendToChange("destination")}
                                        />
                                        <Form.Label className="d-block mb-1 mt-2">
                                            Output target size
                                        </Form.Label>
                                        <Form.Check
                                            inline
                                            type="radio"
                                            id="padding-size-330"
                                            name="padding-target-size"
                                            label="330"
                                            checked={paddingTargetSize === 330}
                                            onChange={() => onPaddingTargetSizeChange(330)}
                                        />
                                        <Form.Check
                                            inline
                                            type="radio"
                                            id="padding-size-546"
                                            name="padding-target-size"
                                            label="546"
                                            checked={paddingTargetSize === 546}
                                            onChange={() => onPaddingTargetSizeChange(546)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bit-continue-button">
                <Button
                    size="medium"
                    fullwidth
                    disabled={!destinationBtcAddress}
                    className={isSending ? "btn-loading" : ""}
                    onClick={preparePsbt}
                >
                    {isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Prepare Tx"}
                </Button>
            </div>
        </div>
    </div>
    );
};