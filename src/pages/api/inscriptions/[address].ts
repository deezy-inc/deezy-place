import { BLOCKSTREAM_API, TURBO_API, TESTNET } from "@lib/constants";
import axios from "axios";
import { validate, Network } from "bitcoin-address-validation";
import { NextApiRequest, NextApiResponse } from "next";

const getInscriptions = async (address: string) =>
    (await axios.get(`${TURBO_API}/wallet/${address}/inscriptions`)).data;

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
    const { version, locktime, size, weight, fee, status } = utxo;
    return {
        version,
        locktime,
        size,
        weight,
        fee,
        status,
        inscriptionId: inscription?.id,
        ...inscription,
        value,
    };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {
        query: { address = "", offset = '0', limit = '10' },
    } = req;

    if ( Array.isArray(address) || Array.isArray(offset) || Array.isArray(limit))  {
        return res.status(400).json({ error: "address, limit and offset values should not be arrays" });
    }

    if (!validate(address, TESTNET ? Network.testnet : Network.mainnet)) {
        res.status(400).json({ error: "Invalid address" });
        return;
    }

    if (parseInt(limit )> 100) {
        res.status(400).json({ error: "Limit cannot be greater than 100" });
        return;
    }

    const from = parseInt(offset, 10);
    const to = from + parseInt(limit, 10);
    const data = await getInscriptions(address);
    const inscriptionsSlice = data?.slice(from, to);
    const inscriptionsWithUtxo = (await Promise.allSettled(inscriptionsSlice.map((inscription) => getUtxoForInscription(inscription, address)))) as {status: 'fulfilled' | 'rejected', value: {}}[]

    const inscriptions = inscriptionsWithUtxo.filter((i) => i.status === "fulfilled")
        .map((i) => i.value);

    const result = {
        data: { inscriptions },
        count: data.length,
        size: inscriptionsWithUtxo.length,
    };
    res.status(200).json(result);
}
