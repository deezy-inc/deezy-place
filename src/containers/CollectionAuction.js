/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";

import {
  takeLatestInscription,
  getNostrInscriptions,
  listAuctionInscriptions,
  getAuctionByCollection,
} from "@services/nosft";
import "react-loading-skeleton/dist/skeleton.css";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";

import OrdinalCard from "@components/collection-inscription";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { HIDE_TEXT_UTXO_OPTION } from "@lib/constants.config";
import Slider, { SliderItem } from "@ui/slider";
import { useWallet } from "@context/wallet-context";

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

// TODO: Make static view, inscriptions shouldn't change position on render
export const updateInscriptions = (acc, curr) => {
  if (!curr) {
    return acc;
  }

  const existingIndex = acc.findIndex(
    (item) => item.id === curr.id && item.num === curr.num
  );

  if (existingIndex !== -1) {
    if (takeLatestInscription(acc[existingIndex], curr)) {
      acc[existingIndex] = curr;
    }
  } else {
    acc.push(curr);
  }

  return acc.sort((a, b) => b.created - a.created).slice(0, MAX_ONSALE);
};

const CollectionAuction = ({ className, space, type, collection }) => {
  const { nostrOrdinalsAddress } = useWallet();
  const [openOrders, setOpenOrders] = useState([]);
  const addOpenOrder$ = useRef(new Subject());
  const addSubscriptionRef = useRef(null);
  const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
  const [activeSort, setActiveSort] = useState();
  const [sortAsc, setSortAsc] = useState(false);

  const [utxosReady, setUtxosReady] = useState(false);

  const [utxosType, setUtxosType] = useState(
    type === "bidding" ? "" : HIDE_TEXT_UTXO_OPTION
  );

  // TODO: Remove not, needed
  useMemo(() => {
    const filteredUtxos = applyFilters({
      utxos: openOrders,
      activeSort,
      sortAsc,
      utxosType,
    });
    setFilteredOwnedUtxos(filteredUtxos);
  }, [openOrders, activeSort, sortAsc, utxosType]);

  const addNewOpenOrder = (order) => {
    addOpenOrder$.current.next(order);
    if (!utxosReady) {
      setUtxosReady(true);
    }
  };

  useEffect(() => {
    if (!collection?.inscriptions?.length) {
      return;
    }

    addSubscriptionRef.current = addOpenOrder$.current
      .pipe(scan(updateInscriptions, openOrders))
      .subscribe(setOpenOrders);

    const fetchAuctions = async () => {
      try {
        const inscriptionsOnAuction = await listAuctionInscriptions(
          collection.slug
        );

        const runningInscriptions = inscriptionsOnAuction.filter(
          (i) => i.status === "RUNNING"
        );

        const inscriptionsWithEvents = collection.inscriptions.filter((i) =>
          runningInscriptions.some((ni) => ni.inscriptionId === i.id)
        );

        const inscriptions = inscriptionsWithEvents.map((i) => {
          const auctionData = runningInscriptions.find(
            (ni) => ni.inscriptionId === i.id
          );

          const nextPriceDrop = auctionData.metadata.find(
            (m) => !m.nostrEventId && m.price !== auctionData.currentPrice
          );

          return {
            ...i,
            inscriptionId: i.id,
            auction: { ...auctionData, nextPriceDrop },
          };
        });

        for (const inscription of inscriptions) {
          addNewOpenOrder(inscription);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchAuctions();

    return () => {
      try {
        addSubscriptionRef?.current?.unsubscribe();
        // eslint-disable-next-line no-empty
      } catch (err) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection?.inscriptions, nostrOrdinalsAddress]);

  let { author: name, slug, icon } = collectionAuthor || {};
  if (name) {
    author = {
      name,
      slug,
      image: {
        src: icon,
      },
    };
  }

  if (!openOrders.length) {
    return <> </>;
  }

  return (
    <div
      id="your-collection"
      className={clsx(
        "rn-product-area",
        space === 1 && "rn-section-gapTop",
        className
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12">
            <SectionTitle
              className="mb--0 live-title"
              {...{ title: "Live Auction" }}
              isLoading={!utxosReady}
            />
          </div>
        </div>

        <div className="row g-5">
          {utxosReady && openOrders.length > 0 && (
            <>
              {filteredOwnedUtxos.map((inscription) => (
                <div
                  key={inscription.id}
                  className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                >
                  <OrdinalCard
                    overlay
                    inscription={inscription}
                    auction={inscription.auction}
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

CollectionAuction.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  type: PropTypes.oneOf(["live", "bidding", "my-bidding"]),
  collection: PropTypes.any,
};

CollectionAuction.defaultProps = {
  space: 1,
  type: "live",
};

export default CollectionAuction;
