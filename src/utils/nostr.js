/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { nostrPool } from "@services/nostr-relay";
import { getEventHash } from "nostr-tools";

import { getOrderInformation } from "@utils/openOrdex";
import { NOSTR_KIND_INSCRIPTION } from "@lib/constants.config";

export async function getInscription(utxo) {
    const orders = (
        await nostrPool.list([
            {
                kinds: [NOSTR_KIND_INSCRIPTION],
                "#u": [utxo],
            },
        ])
    )
        .filter((a) => a.tags.find((x) => x?.[0] === "s")?.[1])
        .sort((a, b) => Number(a.tags.find((x) => x?.[0] === "s")[1]) - Number(b.tags.find((x) => x?.[0] === "s")[1]));

    for (const order of orders) {
        try {
            const orderInformation = await getOrderInformation(order);

            if (Number(orderInformation.value) === Number(order.tags.find((x) => x?.[0] === "s")[1])) {
                return orderInformation;
            }
        } catch (e) {
            return undefined;
        }
    }
    return undefined;
}

export function getEvent({
    inscriptionId,
    inscriptionUtxo,
    networkName = "mainnet",
    priceInSats,
    signedPsbt,
    type = "sell",
    pubkey,
}) {
    const event = {
        kind: NOSTR_KIND_INSCRIPTION,
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ["n", networkName], // Network name (e.g. "mainnet", "signet")
            ["t", type], // Type of order (e.g. "sell", "buy")
            ["i", inscriptionId], // Inscription ID
            ["u", inscriptionUtxo], // Inscription UTXO
            ["s", priceInSats.toString()], // Price in sats
            ["x", "deezy"], // Exchange name (e.g. "openordex")
        ],
        content: signedPsbt,
    };
    event.id = getEventHash(event);

    return event;
}

export async function signAndBroadcastEvent({ utxo, ordinalValue, signedPsbt, pubkey }) {
    const { inscriptionId } = utxo;
    const inscriptionUtxo = `${utxo.txid}:${utxo.vout}`;

    const event = getEvent({ inscriptionId, inscriptionUtxo, priceInSats: ordinalValue, signedPsbt, pubkey });
    const signedEvent = await nostrPool.sign(event);

    // convert the callback to a promise
    return new Promise((resolve, reject) => {
        nostrPool.publish(signedEvent, resolve, reject);
    });
}
