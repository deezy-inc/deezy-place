/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import {
  takeLatestInscription,
  getNostrInscriptions,
  listAuctionInscriptions,
} from "@services/nosft";
import "react-loading-skeleton/dist/skeleton.css";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";

import OrdinalCard from "@components/collection-inscription";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import Slider, { SliderItem } from "@ui/slider";
import { useWallet } from "@context/wallet-context";
import ConnectWallet from "@components/modals/connect-wallet";
import BuyModal from "@components/modals/buy-modal";

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
    (item) => item.id === curr.id && item.num === curr.num,
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

const CollectionOnSale = ({
  className,
  space,
  type,
  collection,
  onDutchLoaded,
}) => {
  const { nostrOrdinalsAddress, onShowConnectModal } = useWallet();
  const [openOrders, setOpenOrders] = useState([]);
  const addOpenOrder$ = useRef(new Subject());
  const addSubscriptionRef = useRef(null);
  const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
  const [activeSort, setActiveSort] = useState();
  const [sortAsc, setSortAsc] = useState(false);

  const [utxosReady, setUtxosReady] = useState(false);

  const [clickedUtxo, setClickedUtxo] = useState(null);
  const [utxosType, setUtxosType] = useState("");
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleBuyModal = () => {
    setShowBuyModal((prev) => !prev);
  };

  function onWalletConnected() {
    setShowBuyModal(true);
  }

  function onCardClicked(id) {
    const inscriptionClicked = openOrders.find((i) => i.inscriptionId === id);
    if (!inscriptionClicked) {
      return;
    }

    setClickedUtxo(inscriptionClicked);

    if (!nostrOrdinalsAddress) {
      onShowConnectModal();
    } else {
      setShowBuyModal(true);
    }
  }

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
        // TODO: Change to use by collection
        const inscriptionsOnAuction = await listAuctionInscriptions(
          collection.slug,
        );

        const runningInscriptions = inscriptionsOnAuction.filter(
          (i) => i.status === "RUNNING",
        );

        const inscriptionsWithEvents = collection.inscriptions.filter((i) =>
          runningInscriptions.some((ni) => ni.inscriptionId === i.id),
        );

        const inscriptions = [];
        for (const i of inscriptionsWithEvents) {
          const auctionData = runningInscriptions.find(
            (ni) => ni.inscriptionId === i.id,
          );

          let nextPriceDrop;
          const currentEvent = auctionData.metadata.find(
            (m) => m.price === auctionData.currentPrice,
          );

          const nostr = currentEvent.nostr;

          if (!currentEvent.isLastEvent) {
            nextPriceDrop = auctionData.metadata[currentEvent.index + 1];
            // create a new date with tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            nextPriceDrop.scheduledTime = tomorrow.getTime();
          }

          inscriptions.push({
            ...i,
            inscriptionId: i.id,
            auction: { ...auctionData, nextPriceDrop },
            nostr,
          });
        }

        for (const inscription of inscriptions) {
          addNewOpenOrder(inscription);
        }

        onDutchLoaded?.();

        setTimeout(() => {
          fetchInscriptions();
        }, 500);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchInscriptions = async () => {
      const chunkSize = 100;

      const totalInscriptions = collection.inscriptions.length;

      try {
        const promises = [];
        for (let i = 0; i < totalInscriptions; i += chunkSize) {
          const inscriptionChunk = collection.inscriptions.slice(
            i,
            i + chunkSize,
          );
          promises.push(
            getNostrInscriptions(inscriptionChunk.map((i) => i.id)),
          );
        }

        const nostrInscriptionsChunks = await Promise.all(promises);

        const nostrInscriptions = nostrInscriptionsChunks.flat();

        const inscriptionsWithEvents = collection.inscriptions.filter((i) =>
          nostrInscriptions.some((ni) => ni.inscriptionId === i.id),
        );

        const inscriptionPromises = inscriptionsWithEvents.map((i) => {
          const nostrInscription = nostrInscriptions.find(
            (ni) => ni.inscriptionId === i.id,
          );

          return {
            ...i,
            inscriptionId: i.id,
            nostr: nostrInscription,
          };
        });

        const inscriptions = await Promise.all(inscriptionPromises);

        for (const inscription of inscriptions) {
          addNewOpenOrder(inscription);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchAuctions();
    // fetchInscriptions();

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
    return <></>;
  }

  return (
    <div
      id="collection-section"
      className={clsx(
        "rn-product-area",
        // "upToDown",
        space === 1 && "rn-section-gapTop",
        className,
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12">
            <SectionTitle
              className="mb--0 live-title"
              {...{ title: "On Sale" }}
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
                    onClick={onCardClicked}
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

          {!nostrOrdinalsAddress && <ConnectWallet cb={onWalletConnected} />}
          {showBuyModal && (
            <BuyModal
              show={showBuyModal}
              handleModal={handleBuyModal}
              utxo={clickedUtxo}
              onSale={() => {
                window.location.href = `/inscription/${clickedUtxo.inscriptionId}`;
              }}
              nostr={clickedUtxo.nostr}
            />
          )}
        </div>
      </div>
    </div>
  );
};

CollectionOnSale.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  type: PropTypes.oneOf(["live", "bidding", "my-bidding"]),
  collection: PropTypes.any,
  onDutchLoaded: PropTypes.func,
};

CollectionOnSale.defaultProps = {
  space: 1,
  type: "live",
};

export default CollectionOnSale;
