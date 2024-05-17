import * as bitcoin from 'bitcoinjs-lib';

const parseHexPsbt = async (txHex, metadata) => {
    let psbt;
    try {
        psbt = bitcoin.Psbt.fromHex(txHex, { network: bitcoin.networks.bitcoin });
    } catch (error) {
        console.error('Failed to parse transaction hex:', error);
        return;
    }

    const inputValues = psbt.txInputs.map((input, index) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        return {
            name: `${txid.slice(0, 4)}...:${input.index}`,
            type: metadata.inputs[index]?.type || '',
            fullName: `${txid}:${input.index}`,
            inputValue: metadata.inputs[index]?.value || 0,
        };
    });

    const outputNodes = psbt.txOutputs.map((output, index) => {
        let address;
        try {
            address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
        } catch (e) {
            console.error('Failed to decode address from output script:', e);
            address = 'Unknown';
        }
        return {
            name: '',
            type: metadata.outputs[index]?.type || '',
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