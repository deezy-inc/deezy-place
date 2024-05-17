import React from "react";
import Button from "@ui/button";
import { TailSpin } from "react-loading-icons";
import { BtcTransactionTree } from "@components/btc-transaction-tree";

export const PreviewTransactionStep = ({ txFee, txFeeRate, hexPsbt, metadata, toggleBtcTreeReady, sign, send, isSending, btcTreeReady }) => (
    <div>
        {hexPsbt ? <BtcTransactionTree hexPsbt={hexPsbt} metadata={metadata} toggleBtcTreeReady={toggleBtcTreeReady} /> : null}
        {txFee ? (
            <p className="btc-fee-text">
                {`Tx fee: `}
                <span>
                    {`${txFee} sats (${txFeeRate} sat/vbyte)`}
                </span>
            </p>
        ) : null}
        <div className="bit-continue-button">
            <Button
                size="medium"
                fullwidth
                className={isSending ? "btn-loading" : ""}
                onClick={txFee ? send : sign}
                disabled={isSending || !btcTreeReady}
            >
                {isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : txFee ? "Send" : "Sign"}
            </Button>
        </div>

    </div>
);
