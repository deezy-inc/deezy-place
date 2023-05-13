/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import { getInscription, shouldReplaceInscription } from "@utils/inscriptions";
import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@services/nostr-relay";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import OrdinalFilter from "@components/ordinal-filter";
import OrdinalCard from "@components/ordinal-card";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { DEFAULT_UTXO_OPTIONS, HIDE_TEXT_UTXO_OPTION } from "@lib/constants.config";

const MAX_ONSALE = 200;

export const updateInscriptions = (acc, curr) => {
    const existingIndex = acc.findIndex((item) => item.inscriptionId === curr.inscriptionId && item.num === curr.num);

    if (existingIndex !== -1) {
        if (shouldReplaceInscription(acc[existingIndex], curr)) {
            acc[existingIndex] = curr;
        }
    } else {
        acc.push(curr);
    }

    return acc.sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE);
};

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

    const defaultUtxosTypes = DEFAULT_UTXO_OPTIONS;

    const [utxosType, setUtxosType] = useState(HIDE_TEXT_UTXO_OPTION);

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
            .pipe(scan(updateInscriptions, openOrders))
            .subscribe(setOpenOrders);
        orderSubscriptionRef.current = nostrPool.subscribeOrders({ limit: MAX_ONSALE }).subscribe(async (event) => {
            try {
                const inscription = await getInscriptionData(event);
                addNewOpenOrder(inscription);
            } catch (error) {
                console.error(error);
            }
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
                            utxosOptions={defaultUtxosTypes}
                            utxosType={utxosType}
                        />
                    </div>
                </div>

                <div className="row g-5">
                    {utxosReady && openOrders.length > 0 && (
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
