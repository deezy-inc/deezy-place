/* eslint-disable react/forbid-prop-types */
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

import clsx from "clsx";
import Anchor from "@ui/anchor";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import { useWallet } from "@context/wallet-context";
import { ImageType } from "@utils/types";
import { shortenStr, MEMPOOL_API_URL } from "@services/nosft";
import { InscriptionPreview } from "@components/inscription-preview";
import RuneDisplay from "@components/rune-display";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const CardOptions = dynamic(() => import("@components/card-options"), {
  ssr: false,
});

const OrdinalCard = ({
  overlay,
  price,
  type,
  utxo,
  authors,
  confirmed,
  date,
  onSale,
  onClick,
  runes,
  alwaysNewTabOnView,
}) => {
  const { nostrOrdinalsAddress } = useWallet();

  const path = utxo?.inscriptionId
    ? `/inscription/${utxo?.inscriptionId}`
    : `/output/${utxo?.txid}:${utxo?.vout}`;

  const num = utxo?.num ? `#${utxo?.num}` : "";
  if (utxo) {
    if (runes) {
      utxo.runes = runes;
    }
    if (date) {
      utxo.date = date;
    }
  }

  console.log("[utxo]", utxo);

  return (
    <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
      <Anchor className="logo-dark" path={utxo?.content ? path : ""}>
        <div className={clsx("product-style-one", !overlay && "no-overlay")}>
          <div className="card-thumbnail">
            <InscriptionPreview utxo={utxo} />
          </div>
          <div className="inscription-details-area">
            {utxo && (
              <div className="inscription-number">
                {utxo?.meta?.name || num}
              </div>
            )}
            {!utxo && <Skeleton width={50} />}
            {runes && runes.length > 0 && (
              <div className="rune-display-container mt-2">
                <RuneDisplay runes={runes} />
              </div>
            )}
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
              alwaysNewTabOnView={alwaysNewTabOnView}
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
  runes: PropTypes.array,
};

OrdinalCard.defaultProps = {
  overlay: false,
};

export default OrdinalCard;
