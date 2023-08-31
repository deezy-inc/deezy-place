/* eslint-disable react/forbid-prop-types */
import { useState } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

import clsx from "clsx";
import Anchor from "@ui/anchor";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import { useWallet } from "@context/wallet-context";
import { shortenStr } from "@services/nosft";
import { InscriptionPreview } from "@components/inscription-preview";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const OrdinalCard = ({ overlay, inscription, auction, onClick }) => {
  const [onSale, setOnSale] = useState(null);

  const id = inscription?.id;
  const num = inscription?.num;
  const inscriptionId = inscription?.inscriptionId
    ? shortenStr(inscription?.inscriptionId)
    : "";
  const { name, slug, icon } = inscription?.collection || {};
  const hasCollection = Boolean(inscription?.collection);

  const inscriptionValue =
    auction?.currentPrice || inscription?.nostr?.value || inscription?.sats;
  const price = {
    amount: inscriptionValue?.toLocaleString("en-US"),
    currency: "Sats",
  };
  const type =
    auction?.currentPrice || inscription?.nostr?.value ? "buy" : "view";
  const date = auction?.startTime
    ? auction?.startTime / 1000
    : inscription?.created;
  const path = `/inscription/${id}`;

  return (
    <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
      <Anchor className="logo-dark" path={path}>
        <div className={clsx("product-style-one", !overlay && "no-overlay")}>
          <div className="card-thumbnail">
            <InscriptionPreview utxo={inscription} />

            {auction?.nextPriceDrop?.scheduledTime && (
              // <CountdownTimer time={auction.nextPriceDrop.scheduledTime} />
              <div className="card-tag">
                <p>Live Auction</p>
              </div>
            )}
          </div>
          <div className="inscription-details-area">
            {inscription && (
              <div className="inscription-number">
                {inscription?.meta?.name || shortenStr(id)}
              </div>
            )}
            {!inscription && <Skeleton width={50} />}
          </div>
          <div className="product-share-wrapper">
            <div className="profile-share">
              {hasCollection && (
                <ClientAvatar
                  key={name}
                  slug={slug}
                  image={{ src: icon }}
                  name={id}
                />
              )}

              {!hasCollection && <Skeleton circle height={40} width={40} />}

              <div className="more-author-text">
                {id && (
                  <Anchor className="logo-dark" path={path}>
                    {inscriptionId ? `${inscriptionId}` : "\u00A0"}
                  </Anchor>
                )}
                {!id && <Skeleton width={140} />}
              </div>
            </div>
          </div>

          {inscription && (
            <ProductBid
              price={price}
              utxo={inscription}
              confirmed
              date={date}
              type={type}
              onSale={onSale}
              nextDrop={auction?.nextPriceDrop?.scheduledTime}
              onClick={onClick}
            />
          )}
          {!inscription && (
            <div className="mt--10">
              <Skeleton width={200} count={1} />
            </div>
          )}
        </div>
      </Anchor>
    </SkeletonTheme>
  );
};

OrdinalCard.propTypes = {
  overlay: PropTypes.bool,
  inscription: PropTypes.object,
  auction: PropTypes.object,
  onClick: PropTypes.func,
};

OrdinalCard.defaultProps = {
  overlay: false,
};

export default OrdinalCard;
