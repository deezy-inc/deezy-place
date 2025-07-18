import React from "react";
import Button from "@ui/button";
import { TailSpin } from "react-loading-icons";
import * as bitcoin from "bitcoinjs-lib";
import OrdinalCard from "@components/ordinal-card";
import { shortenStr } from "@services/nosft";
import { useWallet } from "@context/wallet-context";

const parsePsbtForDisplay = (hexPsbt, metadata, selectedUtxos, userAddress) => {
    if (!hexPsbt) return { inputs: [], outputs: [] };
    
    let psbt;
    try {
        psbt = bitcoin.Psbt.fromHex(hexPsbt, { network: bitcoin.networks.bitcoin });
    } catch (error) {
        console.error('Failed to parse transaction hex:', error);
        return { inputs: [], outputs: [] };
    }

    console.log("[metadata]", metadata);

    // Map inputs to selected UTXOs for display
    const inputs = psbt.txInputs.map((input, index) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        const vout = input.index;
        const selectedUtxo = selectedUtxos.find(utxo => utxo.txid === txid && utxo.vout === vout);
        const inputMetadata = {
            txid,
            vout,
            outpoint: `${txid}:${vout}`,
        }
        console.log("[selectedUtxo]", selectedUtxo);
        console.log("[input]", input);
        if (selectedUtxo) {
            inputMetadata.value = selectedUtxo.value;
            inputMetadata.utxo = selectedUtxo;
        } else {
            const inputData = metadata.inputs[index];
            inputMetadata.value = inputData.value;
            inputMetadata.utxo = {
                txid,
                vout,
                value: inputData.value,
                status: { confirmed: true },
                key: `${txid}:${vout}`
            }
        }
        console.log("[inputMetadata]", inputMetadata);
        return inputMetadata;
    });

    // Parse outputs
    const outputs = psbt.txOutputs.map((output, index) => {
        let address;
        try {
            address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
        } catch (e) {
            console.error('Failed to decode address from output script:', e);
            address = 'Unknown';
        }
        
        // Determine if this is a change output by comparing with user's address
        const isChangeOutput = address === userAddress;
        const outputMetadata = Array.isArray(metadata.outputs) ? metadata.outputs[index] : undefined;
        
        return {
            address,
            value: output.value,
            type: isChangeOutput ? 'change' : 'destination',
            index
        };
    });

    return { inputs, outputs };
};

export const PreviewTransactionStep = ({ 
    txFee, 
    txFeeRate, 
    hexPsbt, 
    metadata, 
    toggleBtcTreeReady, 
    sign, 
    send, 
    isSending, 
    btcTreeReady,
    selectedUtxos 
}) => {
    console.log("[selectedUtxos]", selectedUtxos);
    const { nostrOrdinalsAddress } = useWallet();
    const { inputs, outputs } = parsePsbtForDisplay(hexPsbt, metadata, selectedUtxos, nostrOrdinalsAddress);
    
    // Calculate total input and output values
    const totalInputValue = inputs.reduce((sum, input) => sum + input.value, 0);
    const totalOutputValue = outputs.reduce((sum, output) => sum + output.value, 0);
    const fee = totalInputValue - totalOutputValue;

    return (
        <div className="bulk-send-preview">
            {/* Inputs Section */}
            <div className="inputs-section mb-4">
                <h3 className="section-title mb-3">
                    <i className="feather-arrow-down me-2"></i>
                    Inputs ({inputs.length})
                </h3>
                <div className="inputs-grid">
                    {inputs.map((input, index) => (
                        <div key={input.outpoint} className="input-item">
                            <div className="input-card">
                                <div className="input-thumbnail">
                                    <OrdinalCard 
                                        utxo={input.utxo}
                                        type="view"
                                        overlay={false}
                                        confirmed={input.utxo?.status?.confirmed ?? false}
                                        runes={input.utxo?.runes ?? []}
                                        date={input.utxo?.date ?? null}
                                        alwaysNewTabOnView={true}
                                    />
                                </div>
                                <div className="input-info">
                                    <div className="input-index">#{index + 1}</div>
                                    <div className="input-value">
                                        {input.value.toLocaleString()} sats
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Outputs Section */}
            <div className="outputs-section mb-4">
                <h3 className="section-title mb-3">
                    <i className="feather-arrow-up me-2"></i>
                    Outputs ({outputs.length})
                </h3>
                <div className="outputs-list">
                    {outputs.map((output, index) => (
                        <div key={index} className="output-item">
                            <div className="output-info">
                                <div className="output-index">#{index + 1}</div>
                                <div className="output-details">
                                    <div className="output-address">
                                        {output.address}
                                    </div>
                                    <div className="output-type">
                                        {output.type === 'change' ? 'Change' : 'Destination'}
                                    </div>
                                </div>
                                <div className="output-value">
                                    {output.value.toLocaleString()} sats
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction Summary */}
            <div className="transaction-summary mb-4">
                <div className="summary-row">
                    <span>Total Input:</span>
                    <span>{totalInputValue.toLocaleString()} sats</span>
                </div>
                <div className="summary-row">
                    <span>Total Output:</span>
                    <span>{totalOutputValue.toLocaleString()} sats</span>
                </div>
                <div className="summary-row fee-row">
                    <span>Network Fee:</span>
                    <span>{fee.toLocaleString()} sats ({txFeeRate} sat/vbyte)</span>
                </div>
            </div>

            {/* Sign Transaction Button */}
            <div className="sign-button-container">
                <Button
                    size="large"
                    fullwidth
                    className={isSending ? "btn-loading" : ""}
                    onClick={txFee ? send : sign}
                    disabled={isSending}
                >
                    {isSending ? (
                        <TailSpin stroke="#fec823" speed={0.75} />
                    ) : txFee ? (
                        "Send Transaction"
                    ) : (
                        "Sign Transaction"
                    )}
                </Button>
            </div>
        </div>
    );
};
