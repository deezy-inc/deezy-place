import axios from 'axios';
import LocalStorage, { LocalStorageKeys } from '../services/local-storage';
const Utxo = function (config) {
    const utxoModule = {
        // TODO: Move me away
        delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        getAddressUtxosFromApi: async (address) => {
            const url = `${config.MEMPOOL_API_URL}/api/address/${address}/utxo`;
            const resp = await axios.get(url);
            const utxos = resp.data.map((tx) => ({
                txid: tx.txid,
                vout: tx.vout,
                status: tx.status,
                value: tx.value,
            }));
            return utxos;
        },
        getAddressUtxosManually: async (address) => {
            const outputs = []; // This tracks all outputs that have been seen on the address.
            const spentOutpoints = new Set(); // This tracks all outputs that have been spent from this address.
            let lastSeenTxId = null;
            let lastSeenTxStatus = false;
            let apiEndpoint = '';
            // Fetch unconfirmed txs first
            // We do one pass through to find all outputs and spent outputs.
            while (true) {
                // Short delay to help get around rate limits.
                // eslint-disable-next-line no-await-in-loop
                await utxoModule.delay(100);
                // /txs/chain can only paginate by confirmed transactions
                if (lastSeenTxId != null) {
                    // if the last tx we are trying to paginate with is unconfirmed, we call /txs/chain to get first 50 confirmed txs
                    apiEndpoint = !lastSeenTxStatus ? '/chain' : `/chain/${lastSeenTxId}`;
                }
                const url = `${config.MEMPOOL_API_URL}/api/address/${address}/txs${apiEndpoint}`;
                // eslint-disable-next-line no-await-in-loop
                const resp = await axios.get(url);
                if (!resp?.data)
                    break;
                const txs = resp.data;
                if (txs.length === 0)
                    break;
                // eslint-disable-next-line no-restricted-syntax
                for (const tx of txs) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const input of tx.vin) {
                        spentOutpoints.add(`${input.txid}:${input.vout}`);
                    }
                    for (let n = 0; n < tx.vout.length; n++) {
                        const output = tx.vout[n];
                        if (output.scriptpubkey_address === address) {
                            // @ts-ignore
                            outputs.push({ txid: tx.txid, vout: n, status: tx.status, value: output.value });
                        }
                    }
                }
                lastSeenTxId = txs[txs.length - 1].txid;
                lastSeenTxStatus = txs[txs.length - 1].status.confirmed;
            }
            // Now we filter out all outputs that have been spent.
            // @ts-ignore
            const utxos = outputs.filter((it) => !spentOutpoints.has(`${it.txid}:${it.vout}`));
            return utxos;
        },
        getAddressUtxos: async (address) => {
            try {
                // Try to get the UTXOs from the mempool.space API
                const utxos = await utxoModule.getAddressUtxosFromApi(address);
                return utxos;
            }
            catch (e) {
                // If there was an error, fallback to manually searching for UTXOs
                const utxos = await utxoModule.getAddressUtxosManually(address);
                return utxos;
            }
        },
        doesUtxoContainInscription: async (utxo) => {
            const key = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${utxo.txid}:${utxo.vout}`;
            const cachedOutpoint = await LocalStorage.get(key);
            const outpoint = Boolean(cachedOutpoint);
            if (outpoint) {
                return true;
            }
            const html = await fetch(`${config.ORDINALS_EXPLORER_URL}/output/${utxo.txid}:${utxo.vout}`).then((response) => response.text());
            return html.match(/class=thumbnails/) !== null;
        },
        isSpent: async (utxo) => {
            const [xTxid, vout] = utxo.output.split(':');
            // There are txid starting with $, which are not valid
            const txid = xTxid.split('$').join('');
            const { data: { spent, ...props }, } = await axios.get(`${config.MEMPOOL_API_URL}/api/tx/${txid}/outspend/${vout}`);
            const isSpent = {
                ...props,
                spent,
            };
            return isSpent;
            // disabled for now
            // if (!spent) return isSpent;
            // const { data: last_lock_height } = await axios.get(`${config.MEMPOOL_API_URL}/api/blocks/tip/height`);
            // const confirmations = last_lock_height - props.status.block_height;
            // isSpent.confirmations = confirmations;
            // return isSpent;
        },
        getOutput: async (output) => {
            const { data } = await axios.get(`${config.TURBO_API}/output/${output}`);
            return data;
        },
    };
    return utxoModule;
};
export { Utxo };
