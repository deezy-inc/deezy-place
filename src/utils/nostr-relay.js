import { Observable } from "rxjs";
import { subscribeOrders as subscribeNosftOrders, unsubscribeOrders } from "@services/nosft";

const Nostr = function () {
    const nostrModule = {
        subscriptionOrders: null,
        subscribeOrders: ({ limit }) =>
            new Observable(async (observer) => {
                try {
                    nostrModule.unsubscribeOrders();
                    const orderEvent = (err, event) => {
                        if (err) {
                            observer.error(err);
                        } else {
                            observer.next(event);
                        }
                    };

                    nostrModule.subscriptionOrders = subscribeNosftOrders({ callback: orderEvent, limit });
                } catch (error) {
                    observer.error(error);
                }
            }),
        unsubscribeOrders: () => {
            if (nostrModule.subscriptionOrders) {
                unsubscribeOrders();
                nostrModule.subscriptionOrders.unsub();
                nostrModule.subscriptionOrders = null;
            }
        },
    };
    return nostrModule;
};

const nostrPool = Nostr();
export { nostrPool };
