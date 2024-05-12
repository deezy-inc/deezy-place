/* eslint-disable react/forbid-prop-types */
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

import clsx from "clsx";
import Anchor from "@ui/anchor";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import { useWallet } from "@context/wallet-context";
import { ImageType } from "@utils/types";
import { shortenStr } from "@services/nosft";
import { InscriptionPreview } from "@components/inscription-preview";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { toBTC } from "@containers/product-details";
import useRatity from "src/hooks/use-rarity";
import { Badge } from "react-bootstrap";
import { rarityOptions } from "@utils/utxo";

const getOutputValue = (utxo) => {
  if (utxo?.inscriptionId) {
    return "";
  }

  if (utxo?.txid && utxo?.vout) {
    return `${utxo.txid}:${utxo.vout}`;
  }

  return "";
};

const CardOptions = dynamic(() => import("@components/card-options"), {
  ssr: false,
});

const OrdinalCard = ({
  overlay,
  price,
  type: _type,
  utxo,
  authors,
  confirmed,
  date,
  onSale,
  onClick,
}) => {
  const { nostrOrdinalsAddress } = useWallet();

  const isOwner =
    utxo?.owner === nostrOrdinalsAddress ||
    utxo?.address === nostrOrdinalsAddress;

  const type = isOwner ? "view" : _type;

  const { value: rarity, isLoading: isRarityLoading } = useRatity({
    utxo,
    output: getOutputValue(utxo),
  });

  const path = utxo?.inscriptionId
    ? `/inscription/${utxo?.inscriptionId}`
    : `/output/${utxo?.txid}:${utxo?.vout}`;

  const details = () => {
    const num = utxo?.num
      ? `#${utxo?.num}`
      : utxo?.value
      ? `${toBTC(utxo?.value)} BTC`
      : "";

    return (
      utxo && (
        <div className="inscription-number">
          {utxo?.meta?.name || num}
          {/* {rarity && rarity !== "common" && !isRarityLoading && (
            <>
              {` - `}
              <Badge pill variant={"primary"}>
                {rarity?.toUpperCase()}
              </Badge>
            </>
          )} */}
          {rarity && !isRarityLoading && (
            <>
              {` - `}
              <Badge pill variant={"primary"}>
                {rarity?.toUpperCase()}
              </Badge>
            </>
          )}
        </div>
      )
    );
  };

  return (
    <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
      <Anchor className="logo-dark" path={utxo?.content ? path : null}>
        <div className={clsx("product-style-one", !overlay && "no-overlay")}>
          <div className="card-thumbnail">
            <InscriptionPreview utxo={utxo} />
            {utxo?.auction && (
              <div className="card-tag">
                <p>Live Auction</p>
              </div>
            )}
          </div>
          <div className="inscription-details-area">
            {details()}
            {!utxo && <Skeleton width={50} />}
          </div>
          <div className="product-share-wrapper">
            <div className="profile-share">
              {authors?.map((client) => (
                <ClientAvatar
                  key={client.name}
                  slug={client.slug}
                  name={utxo.inscriptionId || utxo.txid}
                  image={client.image}
                />
              ))}
              {!authors && <Skeleton circle height={40} width={40} />}
              <div className="more-author-text">
                {utxo && Boolean(utxo.inscriptionId || utxo.txid) && (
                  <Anchor className="logo-dark" path={path}>
                    {shortenStr(utxo.inscriptionId || utxo.key)}
                  </Anchor>
                )}
                {(!utxo || (!utxo.inscriptionId && !utxo.txid)) && (
                  <Skeleton width={140} />
                )}
              </div>
            </div>
            {nostrOrdinalsAddress &&
              utxo &&
              type !== "send" &&
              type !== "buy" &&
              type !== "view" && <CardOptions utxo={utxo} onSend={onSale} />}
          </div>
          {/* <Anchor path={`#${slug}`}>
                    <span className="product-name">{title}</span>
                </Anchor> */}
          {/* {description && <span className="latest-bid">{description}</span>} */}
          {/* {!description && <Skeleton width={200} />} */}
          {utxo && (
            <ProductBid
              price={price}
              utxo={utxo}
              confirmed={confirmed}
              date={date}
              type={type}
              onClick={onClick}
            />
          )}
          {!utxo && (
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

  // description: PropTypes.string.isRequired,
  price: PropTypes.shape({
    amount: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  }),
  authors: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      image: ImageType.isRequired,
    }),
  ),
  utxo: PropTypes.object,
  confirmed: PropTypes.bool,
  date: PropTypes.number,
  type: PropTypes.oneOf(["buy", "sell", "send", "view"]),
  onSale: PropTypes.func,
  onClick: PropTypes.func,
};

OrdinalCard.defaultProps = {
  overlay: false,
};

export default OrdinalCard;
