import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "@ui/button";

// Paste-your-key form used both to connect with a raw nostr private key and
// to re-provide it before signing after a page refresh. Private key only —
// spending must always be possible, so view-only npub connects are not
// offered. The parent decides what to do with the key via onSubmit, which
// should throw with a user-facing message when the key is invalid.
const NostrKeyModal = ({ show, onHide, description, submitLabel, onSubmit }) => {
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setKeyInput("");
      setError("");
    }
  }, [show]);

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      onSubmit({ value: keyInput });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal
      className="rn-popup-modal placebid-modal-wrapper"
      show={show}
      onHide={onHide}
      centered
    >
      {show && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onHide}
        >
          <i className="feather-x" />
        </button>
      )}
      <Modal.Header>
        <h3 className="modal-title">Paste your nostr key</h3>
      </Modal.Header>
      <Modal.Body>
        {description && <p className="mb-3">{description}</p>}

        <div className="placebid-form-box">
          <form onSubmit={handleSubmit}>
            <div className="bid-content">
              {/* bid-content-top/left wrappers pick up the theme's input
                  background and sizing; the border is kept visible instead
                  of the theme's transparent-until-focus default */}
              <div className="bid-content-top">
                <div className="bid-content-left w-100">
                  <InputGroup className="mb-2">
                    <Form.Control
                      // Masked like a password so the key can't be
                      // shoulder-surfed; pasting still works as usual
                      type="password"
                      autoComplete="off"
                      spellCheck="false"
                      placeholder="nsec or hex private key..."
                      aria-label="Nostr private key"
                      value={keyInput}
                      onChange={(e) => {
                        setKeyInput(e.target.value);
                        setError("");
                      }}
                      isInvalid={Boolean(error)}
                      style={{
                        border: `2px solid ${error ? "#dc3545" : "var(--color-primary)"}`,
                        padding: "0 15px",
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {error}
                    </Form.Control.Feedback>
                  </InputGroup>
                </div>
              </div>

              <p className="text-muted" style={{ fontSize: "13px" }}>
                Your private key never leaves your browser — it is kept in
                this tab&apos;s memory only, never stored or sent anywhere,
                and you will be asked for it again after a page refresh.
              </p>
            </div>
            <div className="bit-continue-button">
              <Button type="submit" size="medium" fullwidth>
                {submitLabel}
              </Button>
            </div>
          </form>
        </div>
      </Modal.Body>
    </Modal>
  );
};

NostrKeyModal.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func,
  description: PropTypes.string,
  submitLabel: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
};

NostrKeyModal.defaultProps = {
  submitLabel: "Connect",
};

export default NostrKeyModal;
