import { SimplePool, getEventHash } from "nostr-tools";
import { NOSTR_KIND_INSCRIPTION, RELAYS, getMetamaskSigner } from "@services/nosft";
import { cleanEvent } from "@utils/nostr/event";
import { Observable } from "rxjs";
import { getOrderInformation } from "@utils/openOrdex";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

class NostrRelay {
    constructor() {
        this.pool = new SimplePool();
        this.subs = [];
        this.relays = [...RELAYS];
        this.subscriptionOrders = null;
        this.events = [];
    }

    unsubscribeOrders() {
        if (this.subscriptionOrders) {
            this.subs = this.subs.filter((sub) => sub !== this.subscriptionOrders);
            this.subscriptionOrders.unsub();
            this.subscriptionOrders = null;
        }
    }

    subscribeOrders({ limit }) {
        return new Observable(async (observer) => {
            try {
                this.unsubscribeOrders();
                this.subscriptionOrders = this.subscribe(
                    [{ kinds: [NOSTR_KIND_INSCRIPTION], limit }],
                    async (event) => {
                        console.log("event", event);
                        try {
                            const order = await getOrderInformation(event);

                            if (order) observer.next(order);
                        } catch (e) {
                            console.error(e);
                        }
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

        const pubs = this.pool.publish(this.relays, event);
        const pubList = !Array.isArray(pubs) ? [pubs] : pubs;

        let notified = false;
        let totalPubsFailed = 0;

        // loop over all pubs and wait for all to be done
        pubList.forEach((pub) => {
            pub.on("ok", () => {
                // Callback success only once
                if (onSuccess && !notified) {
                    notified = true;
                    onSuccess();
                }
            });
            pub.on("failed", (reason) => {
                console.error(`failed to publish ${reason}`);
                // Callback error only if all pubs failed
                totalPubsFailed += 1;
                if (totalPubsFailed === pubs.length - 1) {
                    if (onError) onError(reason);
                }
            });
        });
    }

    async list(filter) {
        const events = await this.pool.list([...this.relays], filter);
        return events;
    }

    // eslint-disable-next-line class-methods-use-this
    async sign(event) {
        const metamaskDomain = SessionStorage.get(SessionsStorageKeys.DOMAIN);
        const eventBase = { ...event, created_at: Math.floor(Date.now() / 1000) };
        const newEvent = {
            ...eventBase,
            id: getEventHash(eventBase),
        };
        if (metamaskDomain) {
            const metamaskSigner = await getMetamaskSigner(metamaskDomain);
            const signature = await metamaskSigner.signSchnorr(Buffer.from(newEvent.id, "hex"));
            return {
                ...newEvent,
                sig: signature.toString("hex"),
            };
        }
        return window.nostr.signEvent(newEvent);
    }
}

const nostrPool = new NostrRelay();

export { nostrPool };
