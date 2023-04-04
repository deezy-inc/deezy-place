import { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { InscriptionPreview } from "@components/inscription-preview";
import ProductTitle from "@components/product-details/title";
import SendModal from "@components/modals/send-modal";
import InscriptionCollection from "@components/product-details/collection";
import { shortenStr } from "@utils/crypto";
const ProductDetailsArea = ({ space, className, inscription, collection }) => {
    const [showSendModal, setShowSendModal] = useState(false);
    const handleSendModal = () => {
        setShowSendModal((prev) => !prev);
    };

    console.log("inscription", inscription);
    console.log("collection", collection);
    const minted = new Date(inscription.created * 1000).toLocaleString("en-US") || "-";
    // TODO: HABIBI ADD SATS VALUE HERE
    const properties = [
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

    return (
        <div className={clsx("", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="inscription-wrapper g-5">
                    <div className="product-details">
                        <div className="rn-pd-thumbnail">
                            <InscriptionPreview utxo={inscription} />
                        </div>
                    </div>
                    <div className=" mt_md--50 mt_sm--60">
                        <div className="rn-pd-content-area">
                            <ProductTitle title={`Inscription #${inscription.num}`} likeCount={30} />

                            {/* <h6 className="title-name">{inscription.id}</h6> */}
                            {collection && (
                                <div className="catagory-collection">
                                    <InscriptionCollection collection={collection} />
                                </div>
                            )}

                            <div className="rn-pd-bd-wrapper">
                                <div className="rn-pd-sm-property-wrapper">
                                    <div className="property-wrapper">
                                        {properties.map((property) => (
                                            <div key={property.id} className="pd-property-inner">
                                                <span className="color-body type">{property.type}</span>
                                                <span className="color-white value">{`${property.value}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary  btn-small mt--50"
                                onClick={handleSendModal}
                                disabled={!inscription.status.confirmed}
                            >
                                Send Inscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <SendModal show={showSendModal} handleModal={handleSendModal} utxo={inscription} onSale={onSend} />
        </div>
    );
};

ProductDetailsArea.propTypes = {
    space: PropTypes.oneOf([1, 2]),
    className: PropTypes.string,
    inscription: PropTypes.any,
    collection: PropTypes.any,
};

ProductDetailsArea.defaultProps = {
    space: 1,
};

export default ProductDetailsArea;
