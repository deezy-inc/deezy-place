import { TESTNET } from "@lib/constants";

const axios = require("axios");

// eslint-disable-next-line no-promise-executor-return
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// We use blockstream.info for mainnet because it has a higher rate limit than mempool.space (same API).
const baseMempoolUrl = TESTNET ? "https://mempool.space/signet" : "https://blockstream.info";
export const getAddressUtxos = async (address) => {
    // console.log(`Getting address utxos`);
    let utxos;
    try {
        // Most addresses have few enough utxos that we can fetch them all at once with this call.
        const { data } = await axios.get(`${baseMempoolUrl}/api/address/${address}/utxo`);
        utxos = data;
    } catch (err) {
        await delay(100);
        // eslint-disable-next-line no-await-in-loop
        console.log(lastSeenTxId);
        const url = `${baseMempoolUrl}/api/address/${address}/txs${lastSeenTxId ? `/chain/${lastSeenTxId}` : ""}`;
        // eslint-disable-next-line no-await-in-loop
        let resp;
        try {
            // eslint-disable-next-line no-await-in-loop
            resp = await axios.get(url);
        } catch (e) {
            console.log(`Error`);
            console.error(e);
            // eslint-disable-next-line no-await-in-loop
            await delay(5000);
            // eslint-disable-next-line no-continue
            continue;
        }
        const txs = resp.data;
        if (txs.length === 0) break;
        // eslint-disable-next-line no-restricted-syntax
        for (const tx of txs) {
            // eslint-disable-next-line no-restricted-syntax
            for (const input of tx.vin) {
                spentOutpoints.add(`${input.txid}:${input.vout}`);
            }
            for (let n = 0; n < tx.vout.length; n++) {
                const output = tx.vout[n];
                if (output.scriptpubkey_address === address) {
                    outputs.push({
                        txid: tx.txid,
                        vout: n,
                        status: tx.status,
                        value: output.value,
                    });
                }
            }
        }
        lastSeenTxId = txs[txs.length - 1].txid;
    }
    // Now we filter out all outputs that have been spent.
    return outputs.filter((it) => !spentOutpoints.has(`${it.txid}:${it.vout}`));
};
