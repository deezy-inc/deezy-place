import { MEMPOOL_API_URL } from "@lib/constants.config";
import LocalStorage, { LocalStorageKeys } from "@services/local-storage";

import axios from "axios";

// eslint-disable-next-line no-promise-executor-return
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// We use blockstream.info for mainnet because it has a higher rate limit than mempool.space (same API).

// This function retrieves the list of UTXOs for the given address from the mempool.space API
const getAddressUtxosFromApi = async (address) => {
    const url = `${MEMPOOL_API_URL}/api/address/${address}/utxo`;
    const resp = await axios.get(url);
    const utxos = resp.data.map((tx) => ({
        txid: tx.txid,
        vout: tx.vout,
        status: tx.status,
        value: tx.value,
    }));
    return utxos;
};

// This function retrieves the list of UTXOs for the given address by manually searching for them
const getAddressUtxosManually = async (address) => {
    const outputs = []; // This tracks all outputs that have been seen on the address.
    const spentOutpoints = new Set(); // This tracks all outputs that have been spent from this address.
    let lastSeenTxId = null;

    // We do one pass through to find all outputs and spent outputs.
    while (true) {
        // Short delay to help get around rate limits.
        // eslint-disable-next-line no-await-in-loop
        await delay(100);

        const url = `${MEMPOOL_API_URL}/api/address/${address}/txs${lastSeenTxId ? `/chain/${lastSeenTxId}` : ""}`;
        // eslint-disable-next-line no-await-in-loop
        const resp = await axios.get(url);

        if (!resp?.data) break;
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
    const utxos = outputs.filter((it) => !spentOutpoints.has(`${it.txid}:${it.vout}`));
    return utxos;
};

// This function retrieves the list of UTXOs for the given address
export const getAddressUtxos = async (address) => {
    try {
        // Try to get the UTXOs from the mempool.space API
        const utxos = await getAddressUtxosFromApi(address);

        return utxos;
    } catch (e) {
        // If there was an error, fallback to manually searching for UTXOs
        const utxos = await getAddressUtxosManually(address);

        return utxos;
    }
};

export async function doesUtxoContainInscription(utxo) {
    const key = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${utxo.txid}:${utxo.vout}`;
    const cachedOutpoint = await LocalStorage.get(key);
    return Boolean(cachedOutpoint);
}

export async function isSpent(utxo) {
    const [txid, vout] = utxo.output.split(":");
    const {
        data: { spent, ...props },
    } = await axios.get(`${MEMPOOL_API_URL}/api/tx/${txid}/outspend/${vout}`);

    const isUtxoSpent = {
        ...props,
        spent,
    };

    if (!spent) return isUtxoSpent;

    // This data is not yet needed. Let's reduce the number of API calls.
    // const { data: last_lock_height } = await axios.get(`${MEMPOOL_API_URL}/api/blocks/tip/height`);
    // const confirmations = last_lock_height - props.status.block_height;
    // isUtxoSpent.confirmations = confirmations;
    return isUtxoSpent;
}
