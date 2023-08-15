import React from "react";
import { toBTC } from "@containers/product-details";
import { shortenStr } from "@services/nosft";
import clsx from "clsx";
import { TailSpin } from "react-loading-icons";
import { useWallet } from "@context/wallet-context";

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

const gridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr) auto", // This sets up three equally wide columns and one auto-sized
  gap: "16px",
  alignItems: "center",
};

const BidList = ({ bids, onTakeBid, isOnAcceptBid, shouldShowTakeBid }) => {
  return (
    <div className="rn-pd-content-area bidListComponent">
      <div style={gridStyles} className="mb-3 text-uppercase">
        <span>Price</span>
        <span>Buyer</span>
        <span>Time</span>
      </div>
      {bids.length === 0 && <TailSpin stroke="#fec823" speed={0.75} />}
      {bids.map((bid, index) => (
        <Bid
          key={bid.nostr.id}
          bid={bid}
          onTakeBid={onTakeBid}
          className={clsx(index === 0 && "first-bid")}
          isOnAcceptBid={isOnAcceptBid}
          shouldShowTakeBid={shouldShowTakeBid}
        />
      ))}
    </div>
  );
};

const Bid = ({
  bid,
  onTakeBid,
  isOnAcceptBid,
  className,
  shouldShowTakeBid,
}) => {
  const { nostrOrdinalsAddress } = useWallet();
  return (
    <div
      key={bid.nostr.id}
      style={gridStyles}
      className={clsx("bid-wrapper mb-3", className)}
    >
      <span className="color-white value">{`${toBTC(bid.price)} BTC`}</span>
      <span className="color-white value">
        {nostrOrdinalsAddress !== bid.bidOwner
          ? shortenStr(bid.bidOwner || "", 4)
          : "You"}
      </span>
      <span className="color-white value">
        {timeAgo(new Date(bid.created_at * 1000))}
      </span>
      {shouldShowTakeBid && (
        <AcceptBidButton
          bid={bid}
          onTakeBid={onTakeBid}
          isOnAcceptBid={isOnAcceptBid}
        />
      )}
    </div>
  );
};

export default BidList;
