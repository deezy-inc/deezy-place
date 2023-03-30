import { BLOCKSTREAM_API, TURBO_API, TESTNET } from "@lib/constants";
import axios from "axios";
import { validate, Network } from "bitcoin-address-validation";
import { getAddressUtxos } from "@utils/utxos";
import { setupCache } from "axios-cache-interceptor";

const getInscriptions = async (address) => (await axios.get(`${TURBO_API}/wallet/${address}/inscriptions`)).data;

// Defaults to 5 minute cache
const axiosC = setupCache(axios);

const getOutpointForInscription = async (inscription) => {
    const {
        data: {
            inscription: { outpoint },
        },
    } = await axiosC.get(`${TURBO_API}/inscription/${inscription.id}/outpoint`);

    const txid = outpoint
        .substring(0, outpoint.length - 8)
        .match(/[a-fA-F0-9]{2}/g)
        .reverse()
        .join("");

    const item = {
        inscriptionId: inscription?.id,
        txid,
        ...inscription,
    };
    return item;
};

export default async function handler(req, res) {
    const {
        query: { address = "", offset = 0, limit = 10 },
    } = req;

    if (!validate(address, TESTNET ? Network.testnet : Network.mainnet)) {
        res.status(400).json({ error: "Invalid address" });
        return;
    }

    if (limit > 100) {
        res.status(400).json({ error: "Limit cannot be greater than 100" });
        return;
    }
    const from = parseInt(offset, 10);
    const to = from + parseInt(limit, 10);
    const utxos = await getAddressUtxos(address);
    const filteredUtxos = utxos?.slice(from, to);
    const inscriptionData = await getInscriptions(address);
    const inscriptionsWithOutpoint = (
        await Promise.allSettled(inscriptionData.map((inscription) => getOutpointForInscription(inscription)))
    )
        .filter((i) => i.status === "fulfilled")
        .map((i) => i.value);

    const inscriptionsWithOutpointMap = new Map();
    inscriptionsWithOutpoint.forEach((inscription) => inscriptionsWithOutpointMap.set(inscription.txid, inscription));

    const utxosWithInscriptionData = filteredUtxos.map((utxo) => {
        const ins = inscriptionsWithOutpointMap.get(utxo.txid);
        return {
            ...utxo,
            ...ins,
        };
    });

    const result = {
        data: { inscriptions: utxosWithInscriptionData },
        count: utxos.length,
        size: utxosWithInscriptionData.length,
    };
    res.status(200).json(result);
}
