import axios from "axios";
import { BLOCKSTREAM_API, TURBO_API } from "@lib/constants";
import { omit } from "lodash";

const getInscriptions = async (address) => (await axios.get(`${TURBO_API}/wallet/${address}/inscriptions`)).data;

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
        ...omit(utxo, "vin", "vout"),
        inscriptionId: inscription?.id,
        ...inscription,
        value,
    };
};

export default async function handler(req, res) {
    const {
        query: { address, offset, limit },
    } = req;
    const from = parseInt(offset, 10);
    const to = from + parseInt(limit, 10);
    const data = await getInscriptions(address);
    const inscriptions = data?.slice(from, to);
    const inscriptionsWithUtxo = (
        await Promise.allSettled(inscriptions.map((inscription) => getUtxoForInscription(inscription, address)))
    )
        .filter((i) => i.status === "fulfilled")
        .map((i) => i.value);
    const result = { inscriptionsWithUtxo, count: data.length, size: inscriptionsWithUtxo.length };
    res.status(200).json(result);
}
