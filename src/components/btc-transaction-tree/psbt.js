import * as bitcoin from 'bitcoinjs-lib';

const parseHexPsbt = (txHex, _metadata) => {
    const metadata = _metadata ? structuredClone(_metadata) : {};
    let psbt;
    try {
        psbt = bitcoin.Psbt.fromHex(txHex, { network: bitcoin.networks.bitcoin });
    } catch (error) {
        console.error('Failed to parse transaction hex:', error);
        return;
    }

    const inputValues = psbt.txInputs.map((input, index) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        const inputMetadata = Array.isArray(metadata.inputs) ? metadata.inputs[index] : undefined;
        const result = {
            name: `${txid.slice(0, 4)}...:${input.index}`,
            type: inputMetadata ? inputMetadata.type : '',
            fullName: `${txid}:${input.index}`,
            inputValue: inputMetadata ? inputMetadata.value : 0,
        };
        return result;
    });

    const outputNodes = psbt.txOutputs.map((output, index) => {
        let address;
        try {
            address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
        } catch (e) {
            console.error('Failed to decode address from output script:', e);
            address = 'Unknown';
        }
        const outputMetadata = Array.isArray(metadata.outputs) ? metadata.outputs[index] : undefined;
        return {
            name: '',
            type: outputMetadata ? outputMetadata.type : '',
            value: output.value,
            address: address,
        };
    });

    const inputAmount = inputValues.reduce((acc, input) => acc + input.inputValue, 0);
    const outputAmount = outputNodes.reduce((acc, output) => acc + output.value, 0);

    outputNodes.push({
        name: '',
        value: inputAmount - outputAmount,
        type: 'Fee',
        address: '',
    });

    const data = {
        name: 'Transaction',
        children: [
            {
                name: 'Inputs',
                children: inputValues,
            },
            {
                name: 'Outputs',
                children: outputNodes,
            },
        ],
    };
    return data;
}

export { parseHexPsbt };