import { SimplePool, getEventHash } from "nostr-tools";
import { NOSTR_KIND_INSCRIPTION, RELAYS } from "@lib/constants.config";
import { cleanEvent } from "@utils/nostr/event";
import { Observable } from "rxjs";
import { OpenOrdex } from "@utils/openOrdexV3";

export const RELAY_KINDS = {
    INSCRIPTION: 802, // type
};
class NostrRelay {
    constructor() {
        this.pool = new SimplePool();
        this.subs = [];
        this.relays = [...RELAYS];
        this.subscribedToOriginals = false;
        this.events = [];
    }

    subscribeOriginals({ limit }) {
        return new Observable(async (observer) => {
            try {
                this.subscribe(
                    [{ kinds: [NOSTR_KIND_INSCRIPTION], limit }],
                    async (event) => {
                        // debugger
                        // console.log(`New event`, event);
                        const order = await OpenOrdex.getProcessedOrder(event);
                        if (order) observer.next(order);
                    },
                    () => {
                        console.log(`eose`);
                    }
                );
            } catch (error) {
                observer.error(error);
            }
        });
    }

    subscribe(filter, onEvent, onEose) {
        const sub = this.pool.sub([...this.relays], filter);
        sub.on("event", onEvent);
        sub.on("eose", onEose);
        this.subs.push(sub);
        return sub;
    }

    unsubscribeAll() {
        this.subs.forEach((sub) => {
            sub.unsub();
        });
    }

    publish(_event, onSuccess, onError) {
        const event = cleanEvent(_event);
        const pub = this.pool.publish(this.relays, event);
        pub.on("ok", () => {
            console.log(`Accepted our event`);
            if (onSuccess) onSuccess();
        });
        pub.on("failed", (reason) => {
            console.log(`failed to publish ${reason}`);
            if (onError) onError(reason);
        });
    }

    // eslint-disable-next-line class-methods-use-this
    async sign(event) {
        const eventBase = { ...event, created_at: Math.floor(Date.now() / 1000) };
        const newEvent = {
            ...eventBase,
            id: getEventHash(eventBase),
        };
        return window.nostr.signEvent(newEvent);
    }
}

const nostrPool = new NostrRelay();

export { nostrPool };
