import { useState, useEffect, useRef } from "react";
import { nostrPool } from "@services/nostr-relay";
import { MAX_ONSALE } from "@lib/constants";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import { deepClone } from "@utils/methods";

const formatOrder = (inscription) => {
    const inscriptionData = Object.assign(
        {},
        ...inscription.tags
            .map(([tagId, value]) => ({
                [tagId]: value,
            }))
            .map((o) => o)
    );
    const forSaleInscription = deepClone({
        inscriptionTags: inscriptionData,
        ...inscription,
    });
    return forSaleInscription;
};

function useOnSaleOrdinals() {
    const [openOrders, setOpenOrders] = useState([]);
    const addOpenOrder$ = useRef(new Subject());
    const addSubscriptionRef = useRef(null);
    const orderSubscriptionRef = useRef(null);
    const [isLoadingOpenOrders, setIsLoadingOpenOrders] = useState(true);
    const [isWindowFocused, setIsWindowFocused] = useState(true);

    const addNewOpenOrder = ({ type, order }) => {
        if (type === "eose") {
            setIsLoadingOpenOrders(false);
            return;
        }
        addOpenOrder$.current.next(formatOrder(order));
    };

    useEffect(() => {
        if (isWindowFocused) {
            setIsLoadingOpenOrders(true);
            addSubscriptionRef.current = addOpenOrder$.current
                .pipe(
                    scan((acc, curr) => {
                        // We can add only unique ordinals by id or inscriptionId
                        // I keep if for test purposes
                        if (acc.find((order) => order.inscriptionId === curr.inscriptionId)) {
                            return acc;
                        }
                        // Sort by created_at DESC and limit
                        return [...acc, curr].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE);
                    }, openOrders)
                )
                .subscribe(setOpenOrders);
            orderSubscriptionRef.current = nostrPool.subscribeOrders({ limit: MAX_ONSALE }).subscribe(addNewOpenOrder);
        }
        return () => {
            try {
                orderSubscriptionRef?.current?.unsubscribe();
                addSubscriptionRef?.current?.unsubscribe();
                // eslint-disable-next-line no-empty
            } catch (err) {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWindowFocused]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsWindowFocused(!document.hidden);
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return {
        openOrders,
        isLoadingOpenOrders,
    };
}

export default useOnSaleOrdinals;
