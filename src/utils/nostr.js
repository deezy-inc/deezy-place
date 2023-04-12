import { nostrPool } from "@services/nostr-relay";
import { getOrderInformation } from "@utils/openOrdex";

export function getInscription(inscriptionId, callback) {
    return nostrPool.subscribe(
        [
            {
                "#i": [inscriptionId],
            },
        ],
        async (event) => {
            // Get inscription data from event
            try {
                const order = await getOrderInformation(event);

                callback(undefined, order);
            } catch (e) {
                callback(e);
            }
        },
        callback
    );
}
