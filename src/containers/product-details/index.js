/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import { useState, useEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import { InscriptionPreview } from "@components/inscription-preview";
import ProductTitle from "@components/product-details/title";
import SendModal from "@components/modals/send-modal";
import SellModal from "@components/modals/sell-modal";
import AuctionModal from "@components/modals/auction-modal";
import BuyModal from "@components/modals/buy-modal";
import BuyLightningModal from "@components/modals/buy-with-lightning";
import InscriptionCollection from "@components/product-details/collection";
import { useWallet } from "@context/wallet-context";
import { NostrEvenType } from "@utils/types";
import dynamic from "next/dynamic";
import {
  satsToFormattedDollarString,
  shortenStr,
  cancelAuction,
} from "@services/nosft";
import AnimatedText from "@components/animated-text";
import { useAsyncFn } from "react-use";
import { toast } from "react-toastify";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
import BidModal from "@components/modals/bid-modal";
import BidsModal from "@components/modals/bids-modal";
import BidsLoadingButton from "./loading-button";

export const toBTC = (sats) => parseFloat((sats / 100000000).toFixed(8));

const CountdownTimer = dynamic(() => import("@components/countdown-timer"), {
  ssr: false,
});

const CountdownTimerText = dynamic(
  () => import("@components/countdown-timer/countdown-timer-text"),
  {
    ssr: false,
  },
);

const SatsRangeTable = ({ product }) => {
  const satRanges = product?.sat_ranges;

  return (
    <div className="container my-5 uninscribed-sats">
      {satRanges && (
        <Table responsive="md" className="table-dark table-hover">
          <thead>
            <tr>
              <th>Name Range</th>
              <th>Number Range</th>
              <th>Satributes</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(
              { length: Math.ceil(satRanges.length / 2) },
              (_, i) => i * 2,
            ).map((index) => {
              const firstSat = satRanges[index];
              const secondSat = satRanges[index + 1];

              const rarity = firstSat?.rarity;

              return (
                <tr key={index}>
                  <td>{`${firstSat?.name} - ${secondSat?.name}`}</td>
                  <td>{`${firstSat?.number} - ${secondSat?.number}`}</td>
                  <td>
                    <Badge
                      pill
                      variant={rarity === "common" ? "primary" : "warning"}
                    >
                      {rarity.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const ProductDetailsArea = memo(
  ({
    space,
    className,
    inscription = {},
    uninscribedSats,
    collection,
    nostr,
    auction,
    bids,
    onAction,
    isSpent: isUtxoSpent,
    isBidsLoading,
    bidsDisabled = false,
    sellDisabled = false,
    buyDisabled = false,
    auctionDisabled = false,
  }) => {
    const product = useMemo(() => {
      if (!inscription && !uninscribedSats) return {};
      return {
        title: uninscribedSats
          ? `Output ${shortenStr(uninscribedSats.output)}`
          : `Inscription #${inscription.num}`,
        num: uninscribedSats ? "" : inscription.num,
        owner: uninscribedSats ? uninscribedSats.address : inscription.owner,
        minted: uninscribedSats
          ? ""
          : new Date(inscription.created * 1000).toLocaleString("en-US") || "-",
        content_type: uninscribedSats ? "" : inscription.content_type,
        content_length: uninscribedSats
          ? ""
          : `${inscription.content_length} bytes`,
        genesis_fee: uninscribedSats ? "" : inscription.genesis_fee,
        genesis_height: uninscribedSats ? "" : inscription.genesis_height,
        id: uninscribedSats ? "" : shortenStr(inscription.id),
        shorten_owner: uninscribedSats
          ? shortenStr(uninscribedSats.address)
          : shortenStr(inscription.owner),
        value: uninscribedSats ? uninscribedSats.value : inscription.value,
        btcValue: uninscribedSats ? `${toBTC(uninscribedSats.value)} BTC` : "",
        output: uninscribedSats ? shortenStr(uninscribedSats.output) : "",
        sat_ranges: uninscribedSats ? uninscribedSats.sat_ranges : "",
      };
    }, [inscription, uninscribedSats]);
    const { nostrOrdinalsAddress, ordinalsPublicKey } = useWallet();
    const [showSendModal, setShowSendModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [showAuctionModal, setShowAuctionModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showBidModal, setShowBidModal] = useState(false);
    const [showBidsModal, setShowBidsModal] = useState(false);
    const [showBuyLightningModal, setShowBuyLightningModal] = useState(false);
    const [auctionCanceled, setAuctionCanceled] = useState(false);
    const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

    const [{ loading: isCanceling, error: auctionError }, doCancelAction] =
      useAsyncFn(cancelAuction, []);

    const handleSendModal = () => {
      setShowSendModal((prev) => !prev);
    };

    const handleSellModal = () => {
      setShowSellModal((prev) => !prev);
    };

    const handleAuctionModal = () => {
      onAction(showAuctionModal);
      setShowAuctionModal((prev) => !prev);
    };

    const handleBidModal = async () => {
      setShowBidModal((prev) => !prev);
    };

    const handleBidsModal = async () => {
      setShowBidsModal((prev) => !prev);
    };

    const handleCancelAuction = async () => {
      doCancelAction(auction.id);
      setAuctionCanceled(true);
      toast.info("Auction has been cancelled.");
    };

    const handleBuyModal = () => {
      setShowBuyModal((prev) => !prev);
    };

    const handleBuyLightningModal = () => {
      setShowBuyLightningModal((prev) => !prev);
    };

    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
      if (!nostrOrdinalsAddress || !inscription) return;
      setIsOwner(
        nostrOrdinalsAddress &&
          product.owner &&
          nostrOrdinalsAddress === product.owner,
      );
    }, [nostrOrdinalsAddress, product]);

    const properties = [
      {
        id: 8,
        type: "Owner",
        value: product.shorten_owner,
      },
      {
        id: 9,
        type: "Output",
        value: product.output,
      },
      {
        id: 10,
        type: "Value",
        value: product.btcValue,
      },
      {
        id: 7,
        type: "Inscription Id",
        value: product.id,
      },

      {
        id: 1,
        type: "Content Type",
        value: product.content_type,
      },
      {
        id: 2,
        type: "Content Length",
        value: product.content_length,
      },

      {
        id: 4,
        type: "Genesis Height",
        value: product.genesis_height,
      },
      {
        id: 5,
        type: "Genesis Fee",
        value: product.genesis_fee,
      },
      {
        id: 6,
        type: "Number",
        value: product.num,
      },
      {
        id: 3,
        type: "Created",
        value: product.minted,
      },
    ];

    const onSend = () => {};
    const onBid = () => {};
    const onAuction = () => {};
    const onAcceptBid = () => {};

    const { title: auctionTitle, nextPriceDrop: auctionNextPriceDrop } =
      useMemo(() => {
        let title = "";
        let nextPriceDrop = null;
        if (!auction) return { title, nextPriceDrop };

        switch (auction.status) {
          case "PENDING": {
            title = "Dutch Auction Start Soon";
            nextPriceDrop = auction.metadata.find((m) => !m.nostrEventId);
            break;
          }
          case "RUNNING": {
            title = "Dutch Auction";
            nextPriceDrop = auction.metadata.find(
              (m) => !m.nostrEventId && m.price !== auction.currentPrice,
            );
            break;
          }
          case "SPENT": {
            title = "Dutch Auction Ended";
            break;
          }
          default: {
            return { title, nextPriceDrop };
          }
        }
        return { title, nextPriceDrop };
      }, [auction]);

    const isWalletConnected = ordinalsPublicKey && nostrOrdinalsAddress;

    const shouldShowCancelAuction =
      isOwner &&
      !isUtxoSpent &&
      auctionNextPriceDrop &&
      !isCanceling &&
      !auctionError &&
      !auctionCanceled &&
      isWalletConnected;

    const shouldShowNextTime =
      auctionNextPriceDrop &&
      auctionNextPriceDrop.scheduledTime > new Date().getTime();

    const hasNostrEvent = nostr && nostr.value > 0;
    const shouldShowSend = isOwner && isWalletConnected;
    const shouldShowSell =
      !sellDisabled && isOwner && !isUtxoSpent && isWalletConnected;
    const shouldShowAuction =
      !auctionDisabled &&
      isOwner &&
      !isUtxoSpent &&
      !auctionNextPriceDrop &&
      isWalletConnected;
    const shouldShowBuyWithLightning =
      !buyDisabled &&
      !isOwner &&
      hasNostrEvent &&
      !isUtxoSpent &&
      isWalletConnected;
    const shouldShowBuyWithBitcoin =
      !buyDisabled && hasNostrEvent && !isUtxoSpent && isWalletConnected;
    const shouldShowCreateBid =
      !bidsDisabled && !isOwner && !isUtxoSpent && isWalletConnected;
    const shouldShowTakeBid =
      !bidsDisabled && isOwner && !isUtxoSpent && isWalletConnected;
    const shouldShowAvailableBids = !bidsDisabled && bids?.length > 0;
    const shouldShowActions =
      shouldShowSend ||
      shouldShowSell ||
      shouldShowAuction ||
      shouldShowBuyWithLightning ||
      shouldShowBuyWithBitcoin ||
      shouldShowCreateBid ||
      shouldShowAvailableBids;

    return (
      <div className={clsx("", space === 1 && "rn-section-gapTop", className)}>
        <div className="container">
          <div className="inscription-wrapper g-5">
            <div className="product-details">
              <div className="rn-pd-thumbnail">
                <InscriptionPreview utxo={inscription} />
                {auctionNextPriceDrop && (
                  <CountdownTimer time={auctionNextPriceDrop.scheduledTime} />
                )}
              </div>
            </div>

            <div className=" mt_md--50 mt_sm--60">
              <div className="rn-pd-content-area">
                <ProductTitle title={product.title} likeCount={30} />

                {hasNostrEvent && !auction && (
                  <div className="bid mb--10">
                    {isUtxoSpent ? "Bought" : "Listed"} for {toBTC(nostr.value)}{" "}
                    BTC{" "}
                    {nostr.value && bitcoinPrice && (
                      <span className="price">
                        $
                        {satsToFormattedDollarString(nostr.value, bitcoinPrice)}
                      </span>
                    )}
                    <br />
                  </div>
                )}
                {shouldShowAvailableBids && !isUtxoSpent && (
                  <div className="bid mb--10">
                    Top Bid for {toBTC(bids[0]?.price)} BTC{" "}
                    {bitcoinPrice && (
                      <span className="price">
                        $
                        {satsToFormattedDollarString(
                          bids[0]?.price,
                          bitcoinPrice,
                        )}
                      </span>
                    )}
                  </div>
                )}

                {product.sat_ranges && <SatsRangeTable product={product} />}

                {
                  collection ? (
                  <div className="catagory-collection">
                    <InscriptionCollection collection={collection} />
                  </div>
                ) :
                  <div className="catagory-collection">
                      <b>This item is NOT part of a known collection</b>
                  </div>
                }

                {auctionTitle && nostr?.value && (
                  <div className="dutchAuction">
                    <h6 className="title-name live-title">{auctionTitle}</h6>

                    <div className="auction-prices">
                      {auction.status !== "PENDING" && (
                        <div className="animated-price-box">
                          <p className="title">Current price</p>
                          <p className="price">
                            <AnimatedText
                              className="sats"
                              text={String(toBTC(nostr.value))}
                            />{" "}
                            BTC{" "}
                            <AnimatedText
                              className="dollars"
                              text={`$${satsToFormattedDollarString(
                                nostr.value,
                                bitcoinPrice,
                              )}`}
                            />
                          </p>
                        </div>
                      )}

                      {auctionNextPriceDrop && (
                        <div className="animated-price-box">
                          <p className="title">
                            {auction.status === "PENDING"
                              ? "Starting Price"
                              : "Next Price"}
                          </p>
                          <p>
                            <AnimatedText
                              className="sats"
                              text={String(toBTC(auctionNextPriceDrop.price))}
                            />{" "}
                            BTC{" "}
                            <AnimatedText
                              className="dollars"
                              text={`$${satsToFormattedDollarString(
                                auctionNextPriceDrop.price,
                                bitcoinPrice,
                              )}`}
                            />
                          </p>
                        </div>
                      )}
                    </div>
                    {shouldShowNextTime && (
                      <div className="bid mt--10 mb--20">
                        {auction.status === "PENDING" ? "Starts" : "Next Price"}{" "}
                        in{" "}
                        <span className="price">
                          <CountdownTimerText
                            time={auctionNextPriceDrop.scheduledTime}
                          />
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {shouldShowActions && (
                  <div className="rn-pd-sm-property-wrapper">
                    <h6 className="pd-property-title">Actions</h6>

                    <div className="inscription-actions">
                      {shouldShowSend && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleSendModal}
                        >
                          <div className="action">
                            <i className="feather-send" />
                            <span>Send</span>
                          </div>
                        </button>
                      )}

                      {shouldShowSell && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleSellModal}
                        >
                          <div className="action">
                            <i className="feather-tag" />
                            <span>Sell</span>
                          </div>
                        </button>
                      )}

                      {shouldShowAuction && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleAuctionModal}
                        >
                          <div className="action">
                            <i className="feather-book-open" />
                            <span>Auction</span>
                          </div>
                        </button>
                      )}

                      {shouldShowCancelAuction && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleCancelAuction}
                        >
                          <div className="action">
                            <i className="feather-book-open" />
                            <span>Cancel Auction</span>
                          </div>
                        </button>
                      )}

                      {shouldShowBuyWithBitcoin && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleBuyModal}
                        >
                          <div className="action">
                            <i className="feather-shopping-cart" />
                            <span>Buy with bitcoin</span>
                          </div>
                        </button>
                      )}

                      {shouldShowBuyWithLightning && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleBuyLightningModal}
                        >
                          <div className="action">
                            <i className="feather-zap" />
                            <span>Buy with lightning</span>
                          </div>
                        </button>
                      )}

                      {shouldShowCreateBid && (
                        <button
                          className="pd-react-area btn-transparent"
                          type="button"
                          onClick={handleBidModal}
                        >
                          <div className="action">
                            <i className="feather-plus-circle" />
                            <span>Bid</span>
                          </div>
                        </button>
                      )}

                      {
                        <>
                          {shouldShowAvailableBids && !isBidsLoading ? (
                            <button
                              className="pd-react-area btn-transparent"
                              type="button"
                              onClick={handleBidsModal}
                            >
                              <div className="action">
                                <i className="feather-list" />
                                <span>View all Bids</span>
                              </div>
                            </button>
                          ) : (
                            isBidsLoading && <BidsLoadingButton />
                          )}
                        </>
                      }
                    </div>
                  </div>
                )}

                <hr className="mt--20" />

                <div className="rn-pd-bd-wrapper">
                  <div className="rn-pd-sm-property-wrapper">
                    <div className="property-wrapper">
                      {properties
                        .filter((p) => p.value)
                        .map((property) => (
                          <div
                            key={`${property.id}-${property.type}-${property.value}`}
                            className="pd-property-inner"
                          >
                            <span className="color-body type">
                              {property.type}
                            </span>
                            <span className="color-white value">{`${property.value}`}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSendModal && (
          <SendModal
            show={showSendModal}
            handleModal={handleSendModal}
            utxo={uninscribedSats || inscription}
            isUninscribed={!!uninscribedSats}
            onSend={onSend}
          />
        )}
        {!sellDisabled && showSellModal && (
          <SellModal
            show={showSellModal}
            handleModal={handleSellModal}
            utxo={inscription}
            onSale={onSend}
          />
        )}
        {!auctionDisabled && showAuctionModal && (
          <AuctionModal
            show={showAuctionModal}
            handleModal={handleAuctionModal}
            utxo={{ ...inscription, value: nostr?.value || inscription.value }}
            isSpent={isUtxoSpent}
            onSale={onAuction}
          />
        )}
        {!buyDisabled && showBuyModal && (
          <BuyModal
            show={showBuyModal}
            handleModal={handleBuyModal}
            utxo={inscription}
            onSale={onSend}
            nostr={nostr}
          />
        )}
        {!buyDisabled && showBuyLightningModal && (
          <BuyLightningModal
            show={showBuyLightningModal}
            handleModal={handleBuyLightningModal}
            utxo={inscription}
            onSale={onSend}
            nostr={nostr}
          />
        )}
        {!bidsDisabled && showBidModal && (
          <BidModal
            show={showBidModal}
            handleModal={handleBidModal}
            utxo={inscription}
            onBid={onBid}
            suggestedPrice={nostr?.value}
          />
        )}
        {!bidsDisabled && showBidsModal && (
          <BidsModal
            show={showBidsModal}
            handleModal={handleBidsModal}
            utxo={inscription}
            onAcceptBid={onAcceptBid}
            nostr={nostr}
            bids={bids}
            shouldShowTakeBid={shouldShowTakeBid}
          />
        )}
      </div>
    );
  },
);

ProductDetailsArea.propTypes = {
  space: PropTypes.oneOf([1, 2]),
  className: PropTypes.string,
  inscription: PropTypes.any,
  uninscribedSats: PropTypes.any,
  collection: PropTypes.any,
  nostr: NostrEvenType,
  auction: PropTypes.any,
  bids: PropTypes.any,
  isBidsLoading: PropTypes.bool,
  isSpent: PropTypes.bool,
  onAction: PropTypes.func,
  bidsDisabled: PropTypes.bool,
  sellDisabled: PropTypes.bool,
  buyDisabled: PropTypes.bool,
  auctionDisabled: PropTypes.bool,
};

ProductDetailsArea.defaultProps = {
  space: 1,
};

export default ProductDetailsArea;
