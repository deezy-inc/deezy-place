import PropTypes from "prop-types";
import Lottie from "lottie-react";
import checkAnimation from "./check.json";
import Button from "@ui/button";
import { shortenStr } from "@utils/crypto";
import { MEMPOOL_API_URL } from "@lib/constants.config";
import { toast } from "react-toastify";

const TransactionSent = ({ txId, onClose, title = "Transaction Sent" }) => {
    const submit = () => {
        window.open(`${MEMPOOL_API_URL}/tx/${txId}`, "_blank");
    };
    return (
        <div className="tx-success-container">
            <div className="action mb-xxl-5">
                <Lottie animationData={checkAnimation} loop={true} style={{ height: 150 }} autoplay={true} />
                <h5>{title}</h5>
                <div className="txid mb-xxl-5">
                    <button
                        type="button"
                        className="btn-transparent"
                        onClick={() => {
                            navigator.clipboard.writeText(txId);
                            toast("Transaction id copied to clipboard!");
                        }}
                    >
                        {shortenStr(txId)}
                        <i className="feather-copy" />
                    </button>
                </div>
            </div>

            <Button
                size="medium"
                className="btn btn-primary mt-xxl-5 mb-lg-5"
                fullwidth
                autoFocus
                type="button"
                onClick={submit}
            >
                View on explorer
            </Button>

            <Button size="medium" className="btn btn-primary-alta" fullwidth autoFocus onClick={onClose}>
                Close
            </Button>
        </div>
    );
};

TransactionSent.propTypes = {
    title: PropTypes.string,
    txId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default TransactionSent;
