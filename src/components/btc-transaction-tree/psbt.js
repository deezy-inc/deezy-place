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

const parseHexPsbt = async (txHex) => {
    let tx;
    try {
        console.log('txHex:', txHex);
        tx = bitcoin.Psbt.fromHex(txHex, { network: bitcoin.networks.bitcoin }).extractTransaction();
    } catch (error) {
        console.error('Failed to parse transaction hex:', error);
        return;
    }

    if (!tx.ins || !tx.outs) {
        console.error('Transaction inputs or outputs are undefined');
        return;
    }

    const inputValues = await Promise.all(tx.ins.map((input) => {
        const txid = Buffer.from(input.hash).reverse().toString('hex');
        return limit(() => fetchInputValue(txid, input.index).then(value => ({
            name: `${txid.slice(0, 4)}...:${input.index}`,
            inputValue: value,
        })));
    }));

    const data = {
        name: 'Transaction',
        children: [
            {
                name: 'Inputs',
                children: inputValues,
            },
            {
                name: 'Outputs',
                children: tx.outs.map((output) => {
                    let address;
                    try {
                        address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
                    } catch (e) {
                        console.error('Failed to decode address from output script:', e);
                        address = 'Unknown';
                    }
                    return {
                        name: output.script.toString('hex').slice(0, 4) + '...',
                        value: output.value,
                        address: address,
                    };
                }),
            },
        ],
    };
    return data;
}

export { parseHexPsbt };