/* eslint-disable react/forbid-prop-types */
import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import Image from "next/image";
import clsx from "clsx";

import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";

import { ImageType } from "@utils/types";
import { shortenStr } from "@utils/crypto";

const CardOptions = dynamic(() => import("@components/card-options"), {
    ssr: false,
});

const OrdinalCard = ({
    overlay,
    // title,
    // slug,
    // description,
    price,
    image,
    utxo,
    authors,
    onSale,
    // minted,
}) => (
    <div className={clsx("product-style-one", !overlay && "no-overlay")}>
        <div className="card-thumbnail">
            {image?.src && (
                <Image
                    src={image.src}
                    alt={image?.alt || "Ordinal"}
                    width={533}
                    height={533}
                />
            )}
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
                    <span>{shortenStr(utxo.txid)}</span>
                </div>
            </div>
            {/* <CardOptions utxo={utxo} /> */}
        </div>
        {/* <Anchor path={`#${slug}`}>
            <span className="product-name">{title}</span>
        </Anchor>
        <span className="latest-bid">{description}</span> */}
        <ProductBid price={price} utxo={utxo} onSale={onSale} />
    </div>
);

OrdinalCard.propTypes = {
    overlay: PropTypes.bool,
    // title: PropTypes.string.isRequired,
    // slug: PropTypes.string.isRequired,
    // minted: PropTypes.string.isRequired,
    // description: PropTypes.string.isRequired,
    price: PropTypes.shape({
        amount: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
    }).isRequired,
    image: ImageType.isRequired,
    authors: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            slug: PropTypes.string.isRequired,
            image: ImageType.isRequired,
        })
    ),
    utxo: PropTypes.object,
    onSale: PropTypes.func,
};

OrdinalCard.defaultProps = {
    overlay: false,
};

export default OrdinalCard;
