import React from "react";
import TransactionSent from "@components/transaction-sent-confirmation";

export const TransactionSentStep = ({ sentTxId, onClose }) => (
    <TransactionSent txId={sentTxId} title="" onClose={onClose} />
);


