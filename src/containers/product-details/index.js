/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import { useState, useEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
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
  fetchBitcoinPrice,
  shortenStr,
  cancelAuction,
} from "@services/nosft";
import AnimatedText from "@components/animated-text";
import { useAsyncFn } from "react-use";
import { toast } from "react-toastify";

export const toBTC = (sats) => parseFloat((sats / 100000000).toFixed(8));

const CountdownTimer = dynamic(() => import("@components/countdown-timer"), {
  ssr: false,
});

const CountdownTimerText = dynamic(
  () => import("@components/countdown-timer/countdown-timer-text"),
  {
    ssr: false,
  }
);

const ProductDetailsArea = memo(
  ({
    space,
    className,
    inscription,
    collection,
    nostr,
    auction,
    onAction,
    isSpent: isUtxoSpent,
  }) => {
    const { nostrOrdinalsAddress, ordinalsPublicKey } = useWallet();
    const [showSendModal, setShowSendModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [showAuctionModal, setShowAuctionModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showBuyLightningModal, setShowBuyLightningModal] = useState(false);
    const [bitcoinPrice, setBitcoinPrice] = useState();
    const [auctionCanceled, setAuctionCanceled] = useState(false);

    const [{ loading: isCanceling, error: auctionError }, doCancelAction] =
      useAsyncFn(cancelAuction, []);

    useEffect(() => {
      const getPrice = async () => {
        const btcPrice = await fetchBitcoinPrice();
        setBitcoinPrice(btcPrice);
      };

      getPrice();
    }, []);

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
      setIsOwner(
        nostrOrdinalsAddress &&
          inscription.owner &&
          nostrOrdinalsAddress === inscription.owner
      );
    }, [nostrOrdinalsAddress, inscription]);

    const minted =
      new Date(inscription.created * 1000).toLocaleString("en-US") || "-";

    const properties = [
      {
        id: 7,
        type: "Owner",
        value: shortenStr(inscription.owner),
      },
      {
        id: 7,
        type: "Inscription Id",
        value: shortenStr(inscription.id),
      },

      {
        id: 1,
        type: "Content Type",
        value: inscription.content_type,
      },
      {
        id: 2,
        type: "Content Length",
        value: `${inscription.content_length} bytes`,
      },

      {
        id: 4,
        type: "Genesis Height",
        value: inscription.genesis_height,
      },
      {
        id: 5,
        type: "Genesis Fee",
        value: inscription.genesis_fee,
      },
      {
        id: 6,
        type: "Number",
        value: inscription.num,
      },
      {
        id: 3,
        type: "Created",
        value: minted,
      },
    ];

    const onSend = () => {};
    const onAuction = () => {};

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
              (m) => !m.nostrEventId && m.price !== auction.currentPrice
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

    const showCancelAuction =
      isOwner &&
      !isUtxoSpent &&
      auctionNextPriceDrop &&
      !isCanceling &&
      !auctionError &&
      !auctionCanceled;

    const shouldShowNextTime =
      auctionNextPriceDrop &&
      auctionNextPriceDrop.scheduledTime > new Date().getTime();

    const isActionsAvailable = () => {
      if (isOwner) {
        return true;
      }

      return !isOwner && nostr && nostr.value && !isUtxoSpent;
    };

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
                <ProductTitle
                  title={`Inscription #${inscription.num}`}
                  likeCount={30}
                />

                {nostr && nostr.value && !auction && (
                  <>
                    <div className="bid mb--10">
                      {isUtxoSpent ? "Bought" : "Listed"} for{" "}
                      {toBTC(nostr.value)} BTC{" "}
                      <span className="price">
                        $
                        {satsToFormattedDollarString(nostr.value, bitcoinPrice)}
                      </span>
                      <br />
                      {nostr.created_at && (
                        <>
                          {" "}
                          at{" "}
                          <span className="minted">
                            {new Date(nostr.created_at * 1000).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    {auction && <hr className="mt--20" />}
                  </>
                )}

                {collection && (
                  <div className="catagory-collection">
                    <InscriptionCollection collection={collection} />
                  </div>
                )}

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
                                bitcoinPrice
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
                                bitcoinPrice
                              )}`}
                            />
                          </p>
                        </div>
                      )}
                    </div>
                    {shouldShowNextTime && (
                      <div className="bid mt--10 mb--20">
                        Next price in{" "}
                        <span className="price">
                          <CountdownTimerText
                            time={auctionNextPriceDrop.scheduledTime}
                          />
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* <h6 className="title-name">{inscription.id}</h6> */}

                {ordinalsPublicKey &&
                  nostrOrdinalsAddress &&
                  isActionsAvailable() && (
                    <div className="rn-pd-sm-property-wrapper">
                      <h6 className="pd-property-title">Actions</h6>

                      <div className="inscription-actions">
                        {isOwner && (
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

                        {isOwner && !isUtxoSpent && (
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

                        {isOwner && !isUtxoSpent && !auctionNextPriceDrop && (
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

                        {showCancelAuction && (
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

                        {/* {nostr && nostr.value && (
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
                                        )}  */}

                        {!isOwner && nostr && nostr.value && !isUtxoSpent && (
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

                        {/*

                                    <div className="pd-react-area">
                                        <div className="action">
                                            <i className="feather-battery-charging" />
                                            <span>Boost</span>
                                        </div>
                                    </div> */}
                      </div>

                      {/* {isOwner && (
                                    <button
                                        type="button"
                                        className="btn btn-primary  btn-small mt--50"
                                        onClick={handleSendModal}
                                        disabled={!inscription.status.confirmed}
                                    >
                                        Send Inscription
                                    </button>
                                )} */}
                    </div>
                  )}

                <hr className="mt--20" />

                <div className="rn-pd-bd-wrapper">
                  <div className="rn-pd-sm-property-wrapper">
                    <div className="property-wrapper">
                      {properties.map((property) => (
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
            utxo={inscription}
            onSale={onSend}
          />
        )}
        {showSellModal && (
          <SellModal
            show={showSellModal}
            handleModal={handleSellModal}
            utxo={inscription}
            onSale={onSend}
          />
        )}
        {showAuctionModal && (
          <AuctionModal
            show={showAuctionModal}
            handleModal={handleAuctionModal}
            utxo={{ ...inscription, value: nostr?.value || inscription.value }}
            isSpent={isUtxoSpent}
            onSale={onAuction}
          />
        )}
        {showBuyModal && (
          <BuyModal
            show={showBuyModal}
            handleModal={handleBuyModal}
            utxo={inscription}
            onSale={onSend}
            nostr={nostr}
          />
        )}

        {showBuyLightningModal && (
          <BuyLightningModal
            show={showBuyLightningModal}
            handleModal={handleBuyLightningModal}
            utxo={inscription}
            onSale={onSend}
            nostr={nostr}
          />
        )}
      </div>
    );
  }
);

ProductDetailsArea.propTypes = {
  space: PropTypes.oneOf([1, 2]),
  className: PropTypes.string,
  inscription: PropTypes.any,
  collection: PropTypes.any,
  nostr: NostrEvenType,
  auction: PropTypes.any,
  isSpent: PropTypes.bool,
  onAction: PropTypes.func,
};

ProductDetailsArea.defaultProps = {
  space: 1,
};

export default ProductDetailsArea;
