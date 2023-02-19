import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";

const PlaceBidModal = ({ show, handleModal }) => (
    <Modal
        className="rn-popup-modal placebid-modal-wrapper"
        show={show}
        onHide={handleModal}
        centered
    >
        {show && (
            <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleModal}
            >
                <i className="feather-x" />
            </button>
        )}
        <Modal.Header>
            <h3 className="modal-title">Place a bid</h3>
        </Modal.Header>
        <Modal.Body>
            <p>You are about to purchase This Product Form Nuron</p>
            <div className="placebid-form-box">
                <h5 className="title">Your bid</h5>
                <div className="bid-content">
                    <div className="bid-content-top">
                        <div className="bid-content-left">
                            <input id="value" type="text" name="value" />
                            <span>wETH</span>
                        </div>
                    </div>

                    <div className="bid-content-mid">
                        <div className="bid-content-left">
                            <span>Your Balance</span>
                            <span>Service fee</span>
                            <span>Total bid amount</span>
                        </div>
                        <div className="bid-content-right">
                            <span>9578 wETH</span>
                            <span>10 wETH</span>
                            <span>9588 wETH</span>
                        </div>
                    </div>
                </div>
                <div className="bit-continue-button">
                    <Button path="/connect" size="medium" fullwidth>
                        Place a bid
                    </Button>
                    <Button
                        color="primary-alta"
                        size="medium"
                        className="mt--10"
                        onClick={handleModal}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal.Body>
    </Modal>
);

PlaceBidModal.propTypes = {
    show: PropTypes.bool.isRequired,
    handleModal: PropTypes.func.isRequired,
};
export default PlaceBidModal;
