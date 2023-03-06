/* eslint-disable react/forbid-prop-types */
import { useState, useContext, useEffect } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import Image from "next/image";
import clsx from "clsx";
import Anchor from "@ui/anchor";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import { ORDINALS_EXPLORER_URL } from "@lib/constants";
import WalletContext from "@context/wallet-context";
import { ImageType } from "@utils/types";
import { shortenStr } from "@utils/crypto";

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
}) => {
    console.log(utxo);

    const { nostrAddress } = useContext(WalletContext);
    return (
        <div className={clsx("product-style-one", !overlay && "no-overlay")}>
            <div className="card-thumbnail">
                {/* {image?.src && (
                <Image
                    src={image.src}
                    alt={image?.alt || "Ordinal"}
                    width={533}
                    height={533}
                />
            )} */}
                <iframe
                    id="preview"
                    sandbox="allow-scripts allow-same-origin"
                    scrolling="no"
                    loading="lazy"
                    src={`${ORDINALS_EXPLORER_URL}/preview/${utxo.inscriptionId}`}
                ></iframe>
            </div>
            <div className="product-share-wrapper">
                <div className="profile-share">
                    {authors?.map((client) => (
                        <ClientAvatar
                            key={client.name}
                            slug={client.slug}
                            name={client.name}
                            image={client.image}
                        />
                    ))}
                    <div className="more-author-text">
                        {Boolean(utxo.inscriptionId) && (
                            <Anchor
                                className="logo-dark"
                                path={`${ORDINALS_EXPLORER_URL}/inscription/${utxo.inscriptionId}`}
                                target="_blank"
                            >
                                {shortenStr(utxo.inscriptionId)}
                            </Anchor>
                        )}
                    </div>
                </div>
                {nostrAddress && type !== "send" && type !== "buy" && (
                    <CardOptions utxo={utxo} onSale={onSale} />
                )}
            </div>
            {/* <Anchor path={`#${slug}`}>
            <span className="product-name">{title}</span>
        </Anchor>
        <span className="latest-bid">{description}</span> */}
            <ProductBid
                price={price}
                utxo={utxo}
                confirmed={confirmed}
                date={date}
                type={type}
                onSale={onSale}
            />
        </div>
    );
};

OrdinalCard.propTypes = {
    overlay: PropTypes.bool,

    // description: PropTypes.string.isRequired,
    price: PropTypes.shape({
        amount: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
    }).isRequired,
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
    type: PropTypes.oneOf(["buy", "sell", "send"]).isRequired,
    onSale: PropTypes.func,
};

OrdinalCard.defaultProps = {
    overlay: false,
};

export default OrdinalCard;
