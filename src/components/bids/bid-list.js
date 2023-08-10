import React from "react";
import { toBTC } from "@containers/product-details";
import { shortenStr } from "@services/nosft";
import clsx from "clsx";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + " years ago";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months ago";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days ago";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours ago";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

const AcceptBidButton = ({ bid, onTakeBid, isOnAcceptBid }) => (
  <button
    disabled={isOnAcceptBid}
    onClick={() => onTakeBid(bid)}
    className="pd-react-area btn-transparent"
    type="button"
  >
    <div className="action">
      <span>Accept Bid</span>
    </div>
  </button>
);

const Bid = ({ bid, onTakeBid, isOnAcceptBid, className }) => (
  <div
    key={bid.nostr.id}
    className={clsx(
      "bid-wrapper d-flex justify-content-between align-items-center mb-3",
      className,
    )}
  >
    <div className="pd-property-inner flex-grow-1">
      <span className="color-white value">{`${toBTC(bid.price)} BTC`}</span>
    </div>
    <div className="pd-property-inner flex-grow-1">
      <span className="color-white value">
        {shortenStr(bid.bidOwner || "", 4)}
      </span>
    </div>
    <div className="pd-property-inner flex-grow-1">
      <span className="color-white value">
        {timeAgo(new Date(bid.created_at * 1000))}
      </span>
    </div>
    <AcceptBidButton
      bid={bid}
      onTakeBid={onTakeBid}
      isOnAcceptBid={isOnAcceptBid}
    />
  </div>
);

const BidList = ({ bids, onTakeBid, isOnAcceptBid }) => {
  return (
    <div className="rn-pd-content-area bidListComponent">
      <div className="d-flex justify-content-between align-items-center mb-3 text-uppercase">
        <div className="flex-grow-1">
          <span>Price</span>
        </div>
        <div className="flex-grow-1">
          <span>Address</span>
        </div>
        <div className="flex-grow-1">
          <span>Time</span>
        </div>
        <div className="pd-react-area"></div>
      </div>
      {bids.map((bid, index) => (
        <Bid
          key={bid.nostr.id}
          bid={bid}
          onTakeBid={onTakeBid}
          className={clsx(index === 0 && "first-bid")}
        />
      ))}
    </div>
  );
};

export default BidList;
