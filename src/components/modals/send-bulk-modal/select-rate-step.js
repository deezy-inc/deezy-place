import React from "react";
import { InputGroup, Form } from "react-bootstrap";
import Button from "@ui/button";
import { TailSpin } from "react-loading-icons";

import {
    shortenStr,
} from "@services/nosft";

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

export const SelectRateStep = ({ destinationBtcAddress, isBtcInputAddressValid, sendFeeRate, addressOnChange, feeRateOnChange, preparePsbt, isSending, sendingInscriptions, sendingRunes = [], sendingRareSats, sendingUtxos }) => (
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
                            <Form.Range
                                min="1"
                                max="1200"
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
                    </div>
                    <div className="bid-content-right">
                        {!!destinationBtcAddress && (
                            <span>{shortenStr(destinationBtcAddress)}</span>
                        )}
                        <span>{sendFeeRate} sat/vbyte</span>
                    </div>
                </div>
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