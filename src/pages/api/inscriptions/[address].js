import axios from "axios";
import { BLOCKSTREAM_API, TURBO_API } from "@lib/constants";

const getInscriptions = async (address) => axios.get(`${TURBO_API}/wallet/${address}/inscriptions`);

const getUtxoForInscription = async (inscription, address) => {
    const {
        data: {
            inscription: { outpoint },
        },
    } = await axios.get(`${TURBO_API}/inscription/${inscription.id}/outpoint`);

    const txid = outpoint
        .substring(0, outpoint.length - 8)
        .match(/[a-fA-F0-9]{2}/g)
        .reverse()
        .join("");

    const { data: utxo } = await axios.get(`${BLOCKSTREAM_API}/tx/${txid}`);
    const { value } = utxo.vout.find((v) => v.scriptpubkey_address === address);
    return {
        ...utxo,
        inscriptionId: inscription?.id,
        ...inscription,
        value,
    };
};

export default async function handler(req, res) {
    const {
        query: { address, offset, limit },
    } = req;
    const { data } = await getInscriptions(address);
    const inscriptions = data?.slice(offset, limit);
    const inscriptionsWithUtxo = await Promise.allSettled(
        inscriptions.map((inscription) => getUtxoForInscription(inscription, address))
    );

    res.status(200).json({ inscriptionsWithUtxo: inscriptionsWithUtxo.map((x) => x.value) });
}
