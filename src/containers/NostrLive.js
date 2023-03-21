/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import Slider, { SliderItem } from "@ui/slider";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@services/nostr-relay";
import { MAX_ONSALE } from "@lib/constants.config";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import OrdinalCard from "@components/ordinal-card";

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
    const [isWindowFocused, setIsWindowFocused] = useState(true);

    const [openOrders, setOpenOrders] = useState([]);
    const addOpenOrder$ = useRef(new Subject());
    const addSubscriptionRef = useRef(null);
    const orderSubscriptionRef = useRef(null);
    const [refreshHack, setRefreshHack] = useState(false);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    const addNewOpenOrder = (order) => {
        addOpenOrder$.current.next(order);
    };

    const formatOrder = useCallback((inscription) => {
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
    }, []);

    useEffect(() => {
        if (isWindowFocused) {
            addSubscriptionRef.current = addOpenOrder$.current
                .pipe(
                    scan((acc, curr) => {
                        // We can add only unique ordinals by id or inscriptionId
                        // I keep if for test purposes
                        if (acc.find((order) => order.id === curr.id)) {
                            return acc;
                        }
                        // We sort by created_at DESC and limit list
                        return [...acc, curr].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_ONSALE);
                    }, openOrders)
                )
                .subscribe(setOpenOrders);
            orderSubscriptionRef.current = nostrPool.subscribeOrders({ limit: MAX_ONSALE }).subscribe((order) => {
                console.log("order", order);
                addNewOpenOrder(formatOrder(order));
            });
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
        const handleWindowBlur = () => {
            setIsWindowFocused(false);
        };

        const handleWindowFocus = () => {
            setIsWindowFocused(true);
        };

        const handleVisibilityChange = () => {
            setIsWindowFocused(!document.hidden);
        };

        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

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
                    {/* TODO: LET USER GO TO VIEW ALL OF THEM! */}
                    {/* <div className="col-lg-6 col-md-6 col-sm-6 col-12 mt--15">
                        <div className="view-more-btn text-start text-sm-end ">
                            <Anchor className="btn-transparent" path="/nostr-inscriptions">
                                VIEW ALL
                            </Anchor>
                        </div>
                    </div> */}
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
