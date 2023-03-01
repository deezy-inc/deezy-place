/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import { useState } from "react";
import SendModal from "@components/modals/send-modal";

const ProductBid = ({ price, utxo }) => {
    const [showSendModal, setShowSendModal] = useState(false);
    const handleSendModal = () => {
        setShowSendModal((prev) => !prev);
    };

    const minted = !utxo.status.confirmed
        ? "Unconfirmed"
        : new Date(utxo.status.block_time * 1000).toLocaleString();

    return (
        <div className="bid-react-area">
            <div className="last-bid">
                {`${price.amount} ${price.currency}`}
                <span className="minted">{` ${minted}`}</span>
            </div>

            <button
                className="btn btn-small"
                onClick={handleSendModal}
                disabled={!utxo.status.confirmed}
                type="button"
            >
                Send
            </button>
            <SendModal
                show={showSendModal}
                handleModal={handleSendModal}
                utxo={utxo}
            />
        </div>
    );
};

ProductBid.propTypes = {
    price: PropTypes.shape({
        amount: PropTypes.number.isRequired,
        currency: PropTypes.string.isRequired,
    }).isRequired,
    utxo: PropTypes.object,
};

export default ProductBid;
