import React from "react";
import Button from "@ui/button";
import { TailSpin } from "react-loading-icons";
import { BtcTransactionTree } from "@components/btc-transaction-tree";

export const PreviewTransactionStep = ({ txFee, txFeeRate, hexPsbt, metadata, toggleBtcTreeReady, signAndSend, isSending, btcTreeReady }) => (
    <div>
        <h5>Please confirm the transaction</h5>
        {txFee ? (
            <p className="btc-fee-text">
                {`Tx fee: `}
                <span>
                    {`${txFee} sats (${txFeeRate} sat/vbyte)`}
                </span>
                {`. Please double check the inputs and outputs.`}
            </p>
        ) : null}

        {hexPsbt ? <BtcTransactionTree hexPsbt={hexPsbt} metadata={metadata} toggleBtcTreeReady={toggleBtcTreeReady} /> : null}

        <div className="bit-continue-button">
            <Button
                size="medium"
                fullwidth
                className={isSending ? "btn-loading" : ""}
                onClick={signAndSend}
                disabled={isSending || !btcTreeReady}
            >
                {isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Confirm"}
            </Button>
        </div>

    </div>
);
