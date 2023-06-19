/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import { getInscription, takeLatestInscription } from "@services/nosft";
import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@utils/nostr-relay";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import OrdinalFilter from "@components/ordinal-filter";
import OrdinalCard from "@components/ordinal-card";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { DEFAULT_UTXO_OPTIONS, HIDE_TEXT_UTXO_OPTION } from "@lib/constants.config";
import Slider, { SliderItem } from "@ui/slider";

const MAX_ONSALE = 200;

const SliderOptions = {
    infinite: true,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    speed: 4000,
    responsive: [
        {
            breakpoint: 1399,
            settings: {
                slidesToShow: 4,
                slidesToScroll: 1,
            },
        },
        {
            breakpoint: 1200,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 1,
            },
        },
        {
            breakpoint: 992,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 1,
            },
        },
        {
            breakpoint: 576,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
            },
        },
    ],
};

export const updateInscriptions = (acc, curr) => {
    const existingIndex = acc.findIndex((item) => item.inscriptionId === curr.inscriptionId && item.num === curr.num);

    if (existingIndex !== -1) {
        if (takeLatestInscription(acc[existingIndex], curr)) {
            acc[existingIndex] = curr;
        }
    } else {
        acc.push(curr);
    }

    return acc.sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE);
};

const NostrLive = ({ className, space, type, address }) => {
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

    const [utxosType, setUtxosType] = useState(type === "bidding" ? "" : HIDE_TEXT_UTXO_OPTION);
    const isLive = type === "live";

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
        orderSubscriptionRef.current = nostrPool
            .subscribeOrders({ limit: MAX_ONSALE, type, address })
            .subscribe(async (event) => {
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

    const getTitle = () => {
        if (type === "my-bidding") {
            return "My Auctions";
        }

        if (type === "bidding") {
            return "On Auction";
        }

        return "On Sale";
    };

    const title = getTitle();
    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0 live-title" {...{ title }} isLoading={!utxosReady} />
                    </div>

                    {openOrders.length > 0 && (
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
                    )}
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

                    {(!utxosReady || openOrders.length === 0) && (
                        <Slider options={SliderOptions} className="slick-gutter-15">
                            {[...Array(5)].map((_, index) => (
                                <SliderItem key={index} className="ordinal-slide">
                                    <OrdinalCard overlay />
                                </SliderItem>
                            ))}
                        </Slider>
                    )}
                </div>
            </div>
        </div>
    );
};

NostrLive.propTypes = {
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
    type: PropTypes.oneOf(["live", "bidding", "my-bidding"]),
    address: PropTypes.string,
};

NostrLive.defaultProps = {
    space: 1,
    type: "live",
};

export default NostrLive;
