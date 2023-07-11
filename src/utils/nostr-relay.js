import { Observable } from "rxjs";
import {
    subscribeOrders as subscribeNosftOrders,
    unsubscribeOrders,
    subscribeAuctionOrders,
    subscribeMyAuctions,
} from "@services/nosft";

const Nostr = function () {
    const nostrModule = {
        subscriptionOrders: null,
        subscribeOrders: ({ address, limit, type = "live" }) =>
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

                    if (type === "bidding") {
                        nostrModule.subscriptionOrders = subscribeAuctionOrders({ callback: orderEvent, limit });
                        return;
                    }

                    if (type === "my-bidding") {
                        nostrModule.subscriptionOrders = subscribeMyAuctions({ callback: orderEvent, limit, address });
                        return;
                    }

                    nostrModule.subscriptionOrders = subscribeNosftOrders({ callback: orderEvent, limit });
                } catch (error) {
                    observer.error(error);
                }
            }),
        unsubscribeOrders: () => {
            if (nostrModule.subscriptionOrders) {
                unsubscribeOrders();
                if (nostrModule.subscriptionOrders.unsub) {
                    nostrModule.subscriptionOrders.unsub();
                }
                nostrModule.subscriptionOrders = null;
            }
        },
    };
    return nostrModule;
};

const nostrPool = Nostr();
export { nostrPool };
