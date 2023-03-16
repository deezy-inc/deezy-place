import axios from "axios"
import { BLOCKSTREAM_API, TURBO_API } from "@lib/constants";


const getInscriptions = async (address) => {
    return await axios.get(`${TURBO_API}/wallet/${address}/inscriptions`);
}

const getUtxoForInscription = async (inscription, address) => {
    const { data: { inscription: { outpoint }}} = 
        await axios.get(`${TURBO_API}/inscription/${inscription.id}/outpoint`)

    const rawVout = outpoint.slice(-8);
    const txid = outpoint
        .substring(0, outpoint.length - 8)
        .match(/[a-fA-F0-9]{2}/g)
        .reverse()
        .join("")

    const buf = new ArrayBuffer(4)
    const view = new DataView(buf)
    rawVout.match(/../g).forEach((b, i) => {
        view.setUint8(i, parseInt(b, 16))
    });

    const vout = view.getInt32(0, 1)
    const { data: utxo } = await axios.get(`${BLOCKSTREAM_API}/tx/${txid}`);
    const { value } = utxo.vout.find((v) => {
        return v.scriptpubkey_address === address
    })

    return {
        ...utxo,
        inscriptionId: inscription?.id,
        ...inscription,
        value
    };
};


export default async function handler(req, res) {
    const { query: { address, offset, limit }} = req
    const { data } = await getInscriptions(address)
    const inscriptions = data?.slice(offset, limit);
    const inscriptionsWithUtxo = await Promise.allSettled(inscriptions.map(inscription => getUtxoForInscription(inscription, address)))

    res.status(200).json({ inscriptionsWithUtxo })
}
