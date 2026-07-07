import axios from 'axios';
import { Crypto } from './crypto';
import { Utxo } from './utxo';
const Inscriptions = function (config) {
    const utxoModule = Utxo(config);
    const cryptoModule = Crypto(config);
    const inscriptionsModule = {
        // Always fetched fresh: outpoints change every time an inscription
        // moves, and caching them (as done previously) served stale locations
        // that made moved inscriptions' UTXOs look like spendable cardinals
        getOutpoint: async (inscriptionId) => {
            try {
                const result = await axios.get(`${config.TURBO_API}/inscription/${inscriptionId}/outpoint`);
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
                // Prefer the outpoint already present on the wallet-inscriptions
                // response: it is fresh, needs no extra request, and avoids the
                // permanently-cached /inscription/:id/outpoint lookup that returns
                // a STALE outpoint after an inscription moves (which made the
                // moved inscription's UTXO show up as a spendable "cardinal").
                let rawOutpoint = ins?.outpoint?.outpoint;
                if (!rawOutpoint) {
                    // Defensive fallback only when the inline outpoint is missing.
                    const outpointData = await inscriptionsModule.getOutpoint(ins.id);
                    rawOutpoint = outpointData?.inscription?.outpoint;
                }
                if (!rawOutpoint) {
                    // Fail loud, never silently drop: an unmapped inscription would
                    // make its UTXO appear as a spendable "cardinal", risking an
                    // accidental spend of an ordinal. Throwing fails the wallet load
                    // so it can be retried instead of showing unsafe data.
                    throw new Error(`Could not resolve outpoint for inscription ${ins?.id}`);
                }
                const [txid, vout] = cryptoModule.parseOutpoint(rawOutpoint);
                inscriptionsByUtxoKey[`${txid}:${vout}`] = ins;
                return inscriptionsByUtxoKey;
            };
            for (const ins of inscriptions) {
                // @ts-ignore
                batchPromises.push(populateInscriptionsMap(ins));
                if (batchPromises.length === 15) {
                    await Promise.all(batchPromises);
                    batchPromises.length = 0;
                }
            }
            await Promise.all(batchPromises);
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
            return addressInscriptions;
        },
        getTxidVout: async (inscriptionData) => {
            if (inscriptionData.output) {
                const [txid, _vout] = inscriptionData.output.split(':');
                const vout = Number(_vout);
                return { txid, vout, owner: inscriptionData.owner };
            }
            const outpointResult = await inscriptionsModule.getOutpoint(inscriptionData.id);
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
