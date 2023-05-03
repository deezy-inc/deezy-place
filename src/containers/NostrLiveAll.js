/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import { getInscription } from "@utils/inscriptions";
import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@services/nostr-relay";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import OrdinalFilter from "@components/ordinal-filter";
import OrdinalCard from "@components/ordinal-card";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { SUPPORTED_FORMATS } from "@lib/constants.config";

function getPriority(mimeType) {
    const type = mimeType.split("/")[0];
    return SUPPORTED_FORMATS[type] || Number.MAX_VALUE;
}

const MAX_ONSALE = 200;

const NostrLive = ({ className, space }) => {
    const [openOrders, setOpenOrders] = useState([]);
    const addOpenOrder$ = useRef(new Subject());
    const addSubscriptionRef = useRef(null);
    const orderSubscriptionRef = useRef(null);
    const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
    const [refreshHack, setRefreshHack] = useState(false);

    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(false);
    const [utxosReady, setUtxosReady] = useState(false);

    const ownedUtxosTypes = useMemo(() => {
        const options = openOrders.reduce((acc, utxo) => {
            if (!acc[utxo.content_type]) {
                acc[utxo.content_type] = 1;
            }
            acc[utxo.content_type] += 1;
            return acc;
        }, {});
        const sortedOptions = Object.keys(options).sort((a, b) => getPriority(a) - getPriority(b));
        return sortedOptions;
    }, [openOrders]);

    const [utxosType, setUtxosType] = useState("");

    useEffect(() => {
        setUtxosType(ownedUtxosTypes[0]);
    }, [ownedUtxosTypes]);

    useMemo(() => {
        const filteredUtxos = applyFilters({
            utxos: openOrders,
            activeSort,
            sortAsc,
            utxosType,
        });
        setFilteredOwnedUtxos(filteredUtxos);
    }, [openOrders, activeSort, sortAsc, utxosType]);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    const addNewOpenOrder = (order) => {
        addOpenOrder$.current.next(order);
        if (!utxosReady) {
            setUtxosReady(true);
        }
    };

    const getInscriptionData = useCallback(async (event) => {
        const { inscription } = await getInscription(event.inscriptionId);

        const forSaleInscription = deepClone({
            ...inscription,
            ...event,
        });

        return forSaleInscription;
    }, []);

    useEffect(() => {
        addSubscriptionRef.current = addOpenOrder$.current
            .pipe(
                scan(
                    (acc, curr) => [...acc, curr].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE),
                    openOrders
                )
            )
            .subscribe((e) => {
                setOpenOrders(e);
                setFilteredOwnedUtxos(e);
            });
        orderSubscriptionRef.current = nostrPool.subscribeOrders({ limit: MAX_ONSALE }).subscribe(async (event) => {
            const inscription = await getInscriptionData(event);
            addNewOpenOrder(inscription);
        });

        return () => {
            try {
                orderSubscriptionRef?.current?.unsubscribe();
                addSubscriptionRef?.current?.unsubscribe();
                // eslint-disable-next-line no-empty
            } catch (err) {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    console.log("openOrders", openOrders);

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: `On Sale` }} isLoading={!utxosReady} />
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <OrdinalFilter
                            ownedUtxos={openOrders}
                            setFilteredOwnedUtxos={setFilteredOwnedUtxos}
                            setActiveSort={setActiveSort}
                            setSortAsc={setSortAsc}
                            activeSort={activeSort}
                            sortAsc={sortAsc}
                            setUtxosType={setUtxosType}
                            ownedUtxosTypes={ownedUtxosTypes}
                            utxosType={utxosType}
                        />
                    </div>
                </div>

                <div className="row g-5">
                    {utxosReady && openOrders.length > 0 && utxosType && (
                        <>
                            {filteredOwnedUtxos.map((inscription) => (
                                <div key={inscription.id} className="col-5 col-lg-4 col-md-6 col-sm-6 col-12">
                                    <OrdinalCard
                                        overlay
                                        price={{
                                            amount: inscription.value.toLocaleString("en-US"),
                                            currency: "Sats",
                                        }}
                                        type="buy"
                                        confirmed
                                        date={inscription.created_at}
                                        authors={collectionAuthor}
                                        utxo={inscription}
                                        onSale={handleRefreshHack}
                                    />
                                </div>
                            ))}
                            {filteredOwnedUtxos.length === 0 && (
                                <div className="col-12">
                                    <div className="text-center">
                                        <h3>No results found</h3>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

NostrLive.propTypes = {
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
};

NostrLive.defaultProps = {
    space: 1,
};

export default NostrLive;
