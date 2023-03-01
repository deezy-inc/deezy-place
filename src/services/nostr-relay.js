import { SimplePool, getEventHash } from "nostr-tools";
import { RELAYS } from "@lib/constants";
import { cleanEvent } from "@utils/nostr/event";

export const RELAY_KINDS = {
    INSCRIPTION: 802,
};

const NostrRelay = function () {
    this.pool = new SimplePool();
    this.subs = [];
    this.relays = [...RELAYS];
    this.subscribe = async (filter, onEvent, onEose) => {
        let sub = this.pool.sub([...this.relays], filter);

        sub.on("event", onEvent);

        sub.on("eose", onEose);

        this.subs.push(sub);
        return sub;
    };

    this.unsubscribeAll = () => {
        this.subs.forEach((sub) => {
            sub.unsub();
        });
    };

    this.publish = async (_event, onSuccess, onError) => {
        const event = cleanEvent(_event);

        let pubs = await this.pool.publish(this.relays, event);
        pubs.forEach((pub) => {
            pub.on("ok", () => {
                console.log(`Accepted our event`);
                if (onSuccess) onSuccess();
            });
            pub.on("failed", (reason) => {
                console.log(`failed to publish ${reason}`);
                if (onError) onError(reason);
            });
        });
    };
    this.sign = async (event) => {
        event.created_at = Math.floor(Date.now() / 1000);
        event.id = getEventHash(event);

        return await window.nostr.signEvent(event);
    };
};

export default new NostrRelay();
