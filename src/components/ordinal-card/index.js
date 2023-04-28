/* eslint-disable react/forbid-prop-types */
import { useContext } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

import clsx from "clsx";
import Anchor from "@ui/anchor";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import WalletContext from "@context/wallet-context";
import { ImageType } from "@utils/types";
import { shortenStr } from "@utils/crypto";
import { InscriptionPreview } from "@components/inscription-preview";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const CardOptions = dynamic(() => import("@components/card-options"), {
    ssr: false,
});

const OrdinalCard = ({ overlay, price, type, utxo, authors, confirmed, date, onSale }) => {
    const { nostrAddress } = useContext(WalletContext);

    return (
        <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
            <Anchor className="logo-dark" path={utxo?.content ? `/inscription/${utxo?.inscriptionId}` : "#"}>
                <div className={clsx("product-style-one", !overlay && "no-overlay")}>
                    <div className="card-thumbnail">
                        <InscriptionPreview utxo={utxo} />
                    </div>
                    <div className="inscription-details-area">
                        {utxo && (
                            <div className="inscription-number">{utxo.inscriptionId ? `#${utxo.num}` : "\u00A0"}</div>
                        )}
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
                                {utxo && Boolean(utxo.inscriptionId) && (
                                    <Anchor className="logo-dark" path={`/inscription/${utxo.inscriptionId}`}>
                                        {shortenStr(utxo.inscriptionId)}
                                    </Anchor>
                                )}
                                {(!utxo || !utxo.inscriptionId) && <Skeleton width={140} />}
                            </div>
                        </div>
                        {nostrAddress && utxo && type !== "send" && type !== "buy" && (
                            <CardOptions utxo={utxo} onSale={onSale} />
                        )}
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
                            onSale={onSale}
                        />
                    )}
                    {!utxo && (
                        <div className="mt--10">
                            <Skeleton width={200} count={2} />
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
        })
    ),
    utxo: PropTypes.object,
    confirmed: PropTypes.bool,
    date: PropTypes.number,
    type: PropTypes.oneOf(["buy", "sell", "send"]),
    onSale: PropTypes.func,
};

OrdinalCard.defaultProps = {
    overlay: false,
};

export default OrdinalCard;
