import axios from "axios";
import { TURBO_API, MEMPOOL_API_URL } from "@lib/constants.config";

const parseOutpoint = (outpoint) => {
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
    return [txid, vout];
};

export const getInscription = async (inscriptionId) => {
    const props = {};

    const { data: inscriptionData } = await axios.get(`${TURBO_API}/inscription/${inscriptionId}`);

    const { data: outpointResult } = await axios.get(`${TURBO_API}/inscription/${inscriptionId}/outpoint`);
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
