import { useEffect, useState } from "react";
import { getAddressUtxos } from "@utils/utxos";
import { TURBO_API } from "@lib/constants";
const axios = require("axios");

const getSortedUtxos = async (nostrAddress) => {
    const utxos = await getAddressUtxos(nostrAddress);
    const sortedData = utxos.sort((a, b) => b.status.block_time - a.status.block_time);
    return sortedData.map((utxo) => ({ ...utxo, key: `${utxo.txid}:${utxo.vout}` }));
};

function useOrdinals({ nostrAddress }) {
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [utxosReady, setUtxosReady] = useState(false);
    const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);

    const loadUtxos = async () => {
        setUtxosReady(false);

        const utxos = await getSortedUtxos(nostrAddress);
        const inscriptions = await axios.get(`${TURBO_API}/wallet/${nostrAddress}/inscriptions`);

        const inscriptionsByUtxoKey = {};
        const batchPromises = [];
        const populateInscriptionsMap = async (ins) => {
            const outpoint = await getOutpointFromCache(ins.id);

            const rawVout = outpoint.slice(-8);
            const txid = outpoint
                .substring(0, outpoint.length - 8)
                .match(/[a-fA-F0-9]{2}/g)
                .reverse()
                .join("");

            const buf = new ArrayBuffer(4);
            const view = new DataView(buf);
            rawVout.match(/../g).forEach((b, i) => {
                view.setUint8(i, parseInt(b, 16));
            });

            const vout = view.getInt32(0, 1);
            inscriptionsByUtxoKey[`${txid}:${vout}`] = ins;
        };

        for (const ins of inscriptions.data) {
            batchPromises.push(populateInscriptionsMap(ins));
            if (batchPromises.length === 15) {
                await Promise.allSettled(batchPromises);
                batchPromises.length = 0;
            }
        }
        await Promise.allSettled(batchPromises);

        const utxosWithInscriptionData = utxos.map((utxo) => {
            const ins = inscriptionsByUtxoKey[utxo.key];
            return {
                ...utxo,
                inscriptionId: ins?.id,
                ...ins,
            };
        });

        setOwnedUtxos(utxosWithInscriptionData);
        setFilteredOwnedUtxos(utxosWithInscriptionData);
        setUtxosReady(true);
    };

    useEffect(() => {
        loadUtxos();
    }, [nostrAddress]);

    return { ownedUtxos, fetchOwnedUtxos: loadUtxos, filteredOwnedUtxos, utxosReady, setFilteredOwnedUtxos };
}

export default useOrdinals;
