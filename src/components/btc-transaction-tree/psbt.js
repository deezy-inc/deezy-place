import * as bitcoin from 'bitcoinjs-lib';

const parseHexPsbt = (txHex) => {
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

    const data = {
        name: 'Transaction',
        children: [
            {
                name: 'Inputs',
                children: tx.ins.map((input) => ({
                    name: `${Buffer.from(input.hash).reverse().toString('hex').slice(0, 4)}...:${input.index}`,
                    value: input.sequence,
                })),
            },
            {
                name: 'Outputs',
                children: tx.outs.map((output) => ({
                    name: output.script.toString('hex').slice(0, 4) + '...',
                    value: output.value,
                })),
            },
        ],
    };
    return data;
}

export { parseHexPsbt };

