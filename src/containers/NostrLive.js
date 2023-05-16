/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import Slider, { SliderItem } from "@ui/slider";
import { getInscription, isTextInscription } from "@services/nosft";
import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@services/nostr-relay";
import { MAX_FETCH_LIMIT, MAX_LIMIT_ONSALE, MAX_ONSALE, MIN_ONSALE, ONSALE_BATCH_SIZE } from "@lib/constants.config";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import OrdinalCard from "@components/ordinal-card";
import Anchor from "@ui/anchor";

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

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

const useOpenOrdersSubscription = (observable, setter, initialData) => {
    useEffect(() => {
        const subscription = observable
            .pipe(
                scan(
                    (acc, curr) => [...acc, curr].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE),
                    initialData
                )
            )
            .subscribe(setter);

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

const NostrLive = ({ className, space }) => {
    const [openOrders, setOpenOrders] = useState([]);
    const [openTextOrders, setTextOpenOrders] = useState([]);
    const addOpenOrder$ = useRef(new Subject());
    const addTextOpenOrder$ = useRef(new Subject());
    const orderSubscriptionRef = useRef(null);
    const [refreshHack, setRefreshHack] = useState(false);
    const processedEvents = useRef(new Set());
    const fetchLimit = useRef(MAX_LIMIT_ONSALE);
    const processedOrders = useRef(0);
    const fetchIds = useRef([]);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    const addNewOpenOrder = (order) => {
        addOpenOrder$.current.next(order);
    };

    const addNewTextOpenOrder = (order) => {
        addTextOpenOrder$.current.next(order);
    };

    const getInscriptionData = async (event) => {
        const { inscription } = await getInscription(event.inscriptionId);
        const forSaleInscription = deepClone({
            ...inscription,
            ...event,
        });
        return forSaleInscription;
    };

    const unsubscribeOrders = () => {
        try {
            orderSubscriptionRef?.current?.unsubscribe();
        } catch (err) {
            // eslint-disable-next-line no-empty
        }
    };

    const shouldFetchMore = () => {
        const limit =
            processedEvents.current.size === fetchLimit.current &&
            processedOrders.current < MIN_ONSALE &&
            processedEvents.current.size <= MAX_FETCH_LIMIT;
        // Keep {} to easy debugging
        return limit;
    };

    const subscribeOrdersWithLimit = async (limit) => {
        if (openOrders.length >= MAX_ONSALE || processedEvents.current >= MAX_FETCH_LIMIT) return;

        const subscription = nostrPool
            .subscribeOrders({
                limit,
            })
            .subscribe(async (event) => {
                if (processedEvents.current.has(event.id)) return;
                processedEvents.current.add(event.id);
                try {
                    const inscription = await getInscriptionData(event);
                    if (!isTextInscription(inscription)) {
                        processedOrders.current += 1;
                        addNewOpenOrder(inscription);
                    } else {
                        addNewTextOpenOrder(inscription);
                    }
                } catch (error) {
                    console.error(error);
                }

                if (shouldFetchMore() && !fetchIds.current.includes(event.id)) {
                    fetchIds.current.push(event.id);
                    unsubscribeOrders();
                    nostrPool.unsubscribeOrders();
                    fetchLimit.current += ONSALE_BATCH_SIZE;
                    subscribeOrdersWithLimit(fetchLimit.current);
                }
            });

        orderSubscriptionRef.current = subscription;
    };

    useOpenOrdersSubscription(addOpenOrder$.current, setOpenOrders, openOrders);
    useOpenOrdersSubscription(addTextOpenOrder$.current, setTextOpenOrders, openTextOrders);

    useEffect(() => {
        subscribeOrdersWithLimit(fetchLimit.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // We can improve how we handle the orders,
    // but for now we will just concat the text orders with the open orders
    const orders = useMemo(() => {
        if (openOrders.length < MIN_ONSALE) {
            return openOrders.concat(openTextOrders).slice(0, MIN_ONSALE).reverse();
        }
        return openOrders.reverse();
    }, [openOrders, openTextOrders]);

    const renderCards = () => {
        if (orders.length) {
            return orders.map((utxo) => (
                <SliderItem key={utxo.txid} className="ordinal-slide">
                    <OrdinalCard
                        overlay
                        price={{
                            amount: utxo.value.toLocaleString("en-US"),
                            currency: "Sats",
                        }}
                        type="buy"
                        confirmed
                        date={utxo.created_at}
                        authors={collectionAuthor}
                        utxo={utxo}
                        onSale={handleRefreshHack}
                    />
                </SliderItem>
            ));
        }

        return [...Array(5)].map((_, index) => (
            <SliderItem key={index} className="ordinal-slide">
                <OrdinalCard overlay />
            </SliderItem>
        ));
    };

    return (
        <div className={clsx(space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--20">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12 mt_mobile--15">
                        <SectionTitle className="mb--0 live-title" {...{ title: "On Sale" }} />
                    </div>

                    <div className="col-lg-6 col-md-6 col-sm-6 col-12 mt--15">
                        <div className="view-more-btn text-start text-sm-end ">
                            <Anchor className="btn-transparent" path="/inscriptions">
                                VIEW ALL
                                <i className="feather-arrow-right mb-md-5" />
                            </Anchor>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <Slider options={SliderOptions} className="slick-gutter-15">
                            {renderCards()}
                        </Slider>
                    </div>
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
