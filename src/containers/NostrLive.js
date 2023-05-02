/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import Slider, { SliderItem } from "@ui/slider";
import { getInscription, isTextInscription } from "@utils/inscriptions";
import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@services/nostr-relay";
import { MAX_LIMIT_ONSALE, MAX_ONSALE, MIN_ONSALE, ONSALE_BATCH_SIZE } from "@lib/constants.config";
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

const NostrLive = ({ className, space }) => {
    const [openOrders, setOpenOrders] = useState([]);
    const addOpenOrder$ = useRef(new Subject());
    const addSubscriptionRef = useRef(null);
    const orderSubscriptionRef = useRef(null);
    const [refreshHack, setRefreshHack] = useState(false);
    const processedEvents = useRef(new Set());
    const fetchLimit = useRef(MAX_LIMIT_ONSALE);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    const addNewOpenOrder = (order) => {
        addOpenOrder$.current.next(order);
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
            addSubscriptionRef?.current?.unsubscribe();
        } catch (err) {
            // eslint-disable-next-line no-empty
        }
    };

    const shouldFetchMore = () => processedEvents.current.size === fetchLimit.current && openOrders.length < MIN_ONSALE;

    const subscribeOrdersWithLimit = async (limit) => {
        if (openOrders.length >= MAX_ONSALE) return;

        const subscription = nostrPool
            .subscribeOrders({
                limit,
            })
            .subscribe(async (event) => {
                if (processedEvents.current.has(event.id)) return;
                processedEvents.current.add(event.id);

                const inscription = await getInscriptionData(event);
                if (!isTextInscription(inscription)) {
                    addNewOpenOrder(inscription);
                }

                if (shouldFetchMore()) {
                    unsubscribeOrders();
                    nostrPool.unsubscribeOrders();
                    fetchLimit.current += ONSALE_BATCH_SIZE;
                }
            });

        orderSubscriptionRef.current = subscription;
    };

    useEffect(() => {
        addSubscriptionRef.current = addOpenOrder$.current
            .pipe(
                scan(
                    (acc, curr) => [...acc, curr].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE),
                    openOrders
                )
            )
            .subscribe(setOpenOrders);

        subscribeOrdersWithLimit(fetchLimit.current);

        return () => unsubscribeOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchLimit.current]);

    const renderCards = () => {
        if (openOrders.length) {
            return openOrders.map((utxo) => (
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
