import axios from 'axios';
import LocalStorage, { LocalStorageKeys } from '../services/local-storage';
import { Crypto } from './crypto';
import { Utxo } from './utxo';
const Inscriptions = function (config) {
    const utxoModule = Utxo(config);
    const cryptoModule = Crypto(config);
    const inscriptionsModule = {
        invalidateOutputsCache: () => {
            LocalStorage.removePattern(`${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:`);
        },
        // TODO: Implement also some type of server side caching.
        getOutpointFromCache: async (inscriptionId) => {
            try {
                const key = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${inscriptionId}`;
                const cachedOutpoint = await LocalStorage.get(key);
                if (cachedOutpoint) {
                    return cachedOutpoint;
                }
                const result = await axios.get(`${config.TURBO_API}/inscription/${inscriptionId}/outpoint`);
                const [txid, vout] = cryptoModule.parseOutpoint(result.data.inscription.outpoint);
                const utxoKey = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${txid}:${vout}`;
                await LocalStorage.set(key, result.data);
                await LocalStorage.set(utxoKey, result.data);
                return result.data;
            }
            catch (error) {
                console.error(error);
            }
            return undefined;
        },
        getInscriptionsByUtxoKey: async (inscriptions) => {
            const inscriptionsByUtxoKey = {};
            const batchPromises = [];
            const populateInscriptionsMap = async (ins) => {
                const outpointData = await inscriptionsModule.getOutpointFromCache(ins.id);
                if (outpointData) {
                    const { inscription: { outpoint }, } = outpointData;
                    const [txid, vout] = cryptoModule.parseOutpoint(outpoint);
                    inscriptionsByUtxoKey[`${txid}:${vout}`] = ins;
                }
                return inscriptionsByUtxoKey;
            };
            for (const ins of inscriptions) {
                // @ts-ignore
                batchPromises.push(populateInscriptionsMap(ins));
                if (batchPromises.length === 15) {
                    await Promise.allSettled(batchPromises);
                    batchPromises.length = 0;
                }
            }
            await Promise.allSettled(batchPromises);
            return inscriptionsByUtxoKey;
        },
        addInscriptionDataToUtxos: (utxos, inscriptionsByUtxoKey) => utxos.map((utxo) => {
            const ins = inscriptionsByUtxoKey[utxo.key];
            return {
                ...utxo,
                inscriptionId: ins?.id,
                ...ins,
            };
        }),
        getInscriptionsForAddress: async (address) => {
            const response = await axios.get(`${config.TURBO_API}/wallet/${address}/inscriptions`);
            return response.data;
        },
        getInscriptions: async (address) => {
            const addressUtxos = await utxoModule.getAddressUtxos(address);
            const utxos = await cryptoModule.sortUtxos(addressUtxos);
            const inscriptions = await inscriptionsModule.getInscriptionsForAddress(address);
            const inscriptionsByUtxoKey = await inscriptionsModule.getInscriptionsByUtxoKey(inscriptions);
            const addressInscriptions = await inscriptionsModule.addInscriptionDataToUtxos(utxos, inscriptionsByUtxoKey);
            // Once a new inscription is added, invalidate the cache so that it shows up right away
            // without having to wait for the cache to expire.
            const key = `${LocalStorageKeys.INSCRIPTIONS}:${address}`;
            const localAddressInscriptions = await LocalStorage.get(key);
            if (localAddressInscriptions && localAddressInscriptions.length !== addressInscriptions.length) {
                inscriptionsModule.invalidateOutputsCache();
                await LocalStorage.set(key, addressInscriptions);
            }
            return addressInscriptions;
        },
        getTxidVout: async (inscriptionData) => {
            if (inscriptionData.output) {
                const [txid, _vout] = inscriptionData.output.split(':');
                const vout = Number(_vout);
                return { txid, vout, owner: inscriptionData.owner };
            }
            const outpointResult = await inscriptionsModule.getOutpointFromCache(inscriptionData.id);
            const { inscription: { outpoint }, owner, } = outpointResult;
            const [txid, _vout] = cryptoModule.parseOutpoint(outpoint);
            const vout = Number(_vout);
            return { txid, vout, owner };
        },
        // getUtxo to failed
        getInscription: async (inscriptionId, getUtxo = true) => {
            const props = {};
            const { data: inscriptionData } = await axios.get(`${config.TURBO_API}/inscription/${inscriptionId}`);
            const { txid, vout, owner } = await inscriptionsModule.getTxidVout(inscriptionData);
            // Our turbo api returns the collection data already, let's get it if it's not there
            if (inscriptionData?.collection?.name && !inscriptionData?.collection?.icon) {
                try {
                    const { data: collection } = await axios.get(`${config.TURBO_API}/collection/${inscriptionData?.collection?.slug}`);
                    props.collection = collection;
                }
                catch (e) {
                    console.warn('No collection found');
                }
            }
            else {
                props.collection = inscriptionData?.collection;
            }
            props.inscription = {
                ...inscriptionData,
                inscriptionId,
                vout,
                txid,
                value: Number(inscriptionData.sats),
                owner,
            };
            if (getUtxo) {
                // Get related transaction
                const { data: utxo } = await axios.get(`${config.MEMPOOL_API_URL}/api/tx/${txid}`);
                props.utxo = utxo;
            }
            return props;
        },
        isTextInscription: (utxo) => /(text\/plain|application\/json)/.test(utxo?.content_type),
        isImageInscription: (utxo) => /(^image)(\/)[a-zA-Z0-9_]*/gm.test(utxo?.content_type),
        shouldReplaceInscription: (existingInscription, newInscription) => existingInscription.value > newInscription.value ||
            (existingInscription.value === newInscription.value &&
                existingInscription.created_at < newInscription.created_at),
        takeLatestInscription: (existingInscription, newInscription) => existingInscription.created_at < newInscription.created_at,
    };
    return inscriptionsModule;
};
export { Inscriptions };
