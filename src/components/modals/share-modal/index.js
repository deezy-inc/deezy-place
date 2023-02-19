import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";

const ShareModal = ({ show, handleModal }) => (
    <Modal
        className="rn-popup-modal share-modal-wrapper"
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

        <Modal.Header className="share-area">
            <h5 className="modal-title">Share this NFT</h5>
        </Modal.Header>
        <Modal.Body>
            <ul className="social-share-default">
                <li>
                    <a href="#!">
                        <span className="icon">
                            <i className="feather-facebook" />
                        </span>
                        <span className="text">facebook</span>
                    </a>
                </li>
                <li>
                    <a href="#!">
                        <span className="icon">
                            <i className="feather-twitter" />
                        </span>
                        <span className="text">twitter</span>
                    </a>
                </li>
                <li>
                    <a href="#!">
                        <span className="icon">
                            <i className="feather-linkedin" />
                        </span>
                        <span className="text">linkedin</span>
                    </a>
                </li>
                <li>
                    <a href="#!">
                        <span className="icon">
                            <i className="feather-instagram" />
                        </span>
                        <span className="text">instagram</span>
                    </a>
                </li>
                <li>
                    <a href="#!">
                        <span className="icon">
                            <i className="feather-youtube" />
                        </span>
                        <span className="text">youtube</span>
                    </a>
                </li>
            </ul>
        </Modal.Body>
    </Modal>
);

ShareModal.propTypes = {
    show: PropTypes.bool.isRequired,
    handleModal: PropTypes.func.isRequired,
};
export default ShareModal;
