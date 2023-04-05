/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import { getAddressUtxos } from "@utils/utxos";
import { sortUtxos, getInscriptionsForAddress, parseOutpoint, getOutpointFromCache } from "@utils/crypto";

const getInscriptionsByUtxoKey = async (inscriptions) => {
    const inscriptionsByUtxoKey = {};
    const batchPromises = [];
    const populateInscriptionsMap = async (ins) => {
        const outpoint = await getOutpointFromCache(ins.id);
        const [txid, vout] = parseOutpoint(outpoint);

        inscriptionsByUtxoKey[`${txid}:${vout}`] = ins;
    };

    for (const ins of inscriptions) {
        batchPromises.push(populateInscriptionsMap(ins));
        if (batchPromises.length === 15) {
            await Promise.allSettled(batchPromises);
            batchPromises.length = 0;
        }
    }

    await Promise.allSettled(batchPromises);
    return inscriptionsByUtxoKey;
};

const addInscriptionDataToUtxos = (utxos, inscriptionsByUtxoKey) =>
    utxos.map((utxo) => {
        const ins = inscriptionsByUtxoKey[utxo.key];
        return {
            ...utxo,
            inscriptionId: ins?.id,
            ...ins,
        };
    });

export const getInscriptions = async (address) => {
    const addressUtxos = await getAddressUtxos(address);
    const utxos = await sortUtxos(addressUtxos);
    const inscriptions = await getInscriptionsForAddress(address);

    const inscriptionsByUtxoKey = await getInscriptionsByUtxoKey(inscriptions);

    return addInscriptionDataToUtxos(utxos, inscriptionsByUtxoKey);
};
