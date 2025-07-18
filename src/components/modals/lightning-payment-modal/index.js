/* eslint-disable react/forbid-prop-types */
import { useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";

const LightningPaymentModal = ({
  show,
  handleModal,
  bolt11Invoice,
  onPayWithLightning,
  onCopyInvoice,
  isProcessing = false,
  isPolling = false,
}) => {
  const [isPaying, setIsPaying] = useState(false);

  const handlePayWithLightning = async () => {
    setIsPaying(true);
    try {
      await onPayWithLightning(bolt11Invoice);
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyInvoice = async () => {
    try {
      await onCopyInvoice(bolt11Invoice);
      toast.success("Lightning invoice copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy invoice:", error);
      toast.error("Failed to copy invoice to clipboard.");
    }
  };

  return (
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
        <h3 className="modal-title">Lightning Payment Required</h3>
      </Modal.Header>
      <Modal.Body>
        <div className="lightning-payment-content">
          <p className="mb-4">
            Your transaction has been signed. To complete the boost, please pay the lightning invoice below.
            {isPolling && (
              <div className="alert alert-info mt-3">
                <i className="feather-loader me-2" style={{ animation: 'spin 1s linear infinite' }}></i>
                Checking for payment confirmation...
              </div>
            )}
          </p>
          
          {/* QR Code */}
          <div className="qr-code-container text-center mb-4">
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={bolt11Invoice}
                size={200}
                level="M"
                includeMargin={true}
                className="qr-code"
              />
            </div>
          </div>

          {/* Payment Options */}
          <div className="payment-options">
            <div className="row">
              <div className="col-12 mb-3">
                <Button
                  size="medium"
                  fullwidth
                  className={isPaying || isProcessing ? "btn-loading" : ""}
                  onClick={handlePayWithLightning}
                  disabled={isPaying || isProcessing}
                >
                  {isPaying || isProcessing ? (
                    <TailSpin stroke="#fec823" speed={0.75} />
                  ) : (
                    "Pay with Lightning Extension"
                  )}
                </Button>
              </div>
              <div className="col-12">
                <Button
                  size="medium"
                  fullwidth
                  color="primary-alta"
                  onClick={handleCopyInvoice}
                  disabled={isPaying || isProcessing}
                >
                  Copy Lightning Invoice
                </Button>
              </div>
            </div>
          </div>

          {/* Invoice Display */}
          <div className="invoice-display mt-4">
            <div className="form-group">
              <label className="form-label">Lightning Invoice:</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={bolt11Invoice}
                  readOnly
                  style={{ fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

LightningPaymentModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  bolt11Invoice: PropTypes.string.isRequired,
  onPayWithLightning: PropTypes.func.isRequired,
  onCopyInvoice: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  isPolling: PropTypes.bool,
};

export default LightningPaymentModal; 