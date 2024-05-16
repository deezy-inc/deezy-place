import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import pLimit from 'p-limit';

const limit = pLimit(5); // Limit to 5 concurrent requests

const fetchInputValue = async (txid, index) => {
    try {
        const response = await axios.get(`https://blockstream.info/api/tx/${txid}`);
        const output = response.data.vout[index];
        return output.value;
    } catch (error) {
        console.error(`Failed to fetch input value for txid ${txid} index ${index}:`, error);
        return null;
    }
};

const parseHexPsbt = async (txHex, metadata) => {
    let psbt;
    try {
        console.log('txHex:', txHex);
        psbt = bitcoin.Psbt.fromHex(txHex, { network: bitcoin.networks.bitcoin });
    } catch (error) {
        console.error('Failed to parse transaction hex:', error);
        return;
    }

    const inputValues = await Promise.all(psbt.txInputs.map((input, index) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        return limit(() => fetchInputValue(txid, input.index).then(value => ({
            name: `${txid.slice(0, 4)}...:${input.index}`,
            type: metadata.inputs[index]?.type || '',
            fullName: `${txid}:${input.index}`,
            inputValue: value,
        })));
    }));

    const outputNodes = psbt.txOutputs.map((output, index) => {
        console.log('output:', output);
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

    console.log('outputNodes:', outputNodes);

    const inputAmount = inputValues.reduce((acc, input) => acc + input.inputValue, 0);
    const outputAmount = outputNodes.reduce((acc, output) => acc + output.value, 0);

    console.log('inputAmount:', inputAmount);
    console.log('outputAmount:', outputAmount);
    console.log({ txIns: psbt.txInputs, txOuts: psbt.txOutputs });

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