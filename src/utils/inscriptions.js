/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import { getAddressUtxos } from "@utils/utxos";
import { sortUtxos, parseOutpoint } from "@utils/crypto";
import axios from "axios";
import { TURBO_API, MEMPOOL_API_URL } from "@lib/constants";
import LocalStorage, { LocalStorageKeys } from "@services/local-storage";

// TODO: Implement also some type of server side caching.
const getOutpointFromCache = async (inscriptionId) => {
    const key = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${inscriptionId}`;
    const cachedOutpoint = await LocalStorage.get(key);
    if (cachedOutpoint) {
        return cachedOutpoint;
    }

    const result = await axios.get(`${TURBO_API}/inscription/${inscriptionId}/outpoint`);

    await LocalStorage.set(key, result.data);

    return result.data;
};

const getInscriptionsByUtxoKey = async (inscriptions) => {
    const inscriptionsByUtxoKey = {};
    const batchPromises = [];
    const populateInscriptionsMap = async (ins) => {
        const {
            inscription: { outpoint },
        } = await getOutpointFromCache(ins.id);
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

const getInscriptionsForAddress = async (address) => {
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

export const getInscription = async (inscriptionId) => {
    const props = {};

    const { data: inscriptionData } = await axios.get(`${TURBO_API}/inscription/${inscriptionId}`);

    const outpointResult = await getOutpointFromCache(inscriptionId);
    const {
        inscription: { outpoint },
        owner,
    } = outpointResult;

    const [txid, vout] = parseOutpoint(outpoint);
    // Get related transaction
    const { data: utxo } = await axios.get(`${MEMPOOL_API_URL}/api/tx/${txid}`);
    // get value of the utxo
    const { value } = utxo.vout[vout];

    if (inscriptionData?.collection?.name) {
        try {
            const { data: collection } = await axios.get(
                `${TURBO_API}/collection/${inscriptionData?.collection?.slug}`
            );
            props.collection = collection;
        } catch (e) {
            console.warn("No collection found");
        }
    }

    props.inscription = { ...inscriptionData, inscriptionId, ...utxo, vout, value, owner };

    return props;
};
