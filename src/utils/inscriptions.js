/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import { getAddressUtxos } from "@utils/utxos";
import { sortUtxos, parseOutpoint } from "@utils/crypto";
import axios from "axios";
import { TURBO_API } from "@lib/constants";
import LocalStorage, { LocalStorageKeys } from "@services/local-storage";

export const getOutpointFromCache = async (inscriptionId) => {
    const key = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${inscriptionId}`;
    const cachedOutpoint = await LocalStorage.get(key);
    if (cachedOutpoint) {
        return cachedOutpoint;
    }

    const {
        data: {
            inscription: { outpoint },
        },
    } = await axios.get(`${TURBO_API}/inscription/${inscriptionId}/outpoint`);

    await LocalStorage.set(key, outpoint);

    return outpoint;
};

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

export const getInscriptionsForAddress = async (address) => {
    const response = await axios.get(`${TURBO_API}/wallet/${address}/inscriptions`);
    return response.data;
};

export const getInscriptions = async (address) => {
    const addressUtxos = await getAddressUtxos(address);
    const utxos = await sortUtxos(addressUtxos);
    const inscriptions = await getInscriptionsForAddress(address);

    const inscriptionsByUtxoKey = await getInscriptionsByUtxoKey(inscriptions);

    return addInscriptionDataToUtxos(utxos, inscriptionsByUtxoKey);
};
