/* eslint-disable react/no-array-index-key */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ConnectWallet from "@components/modals/connect-wallet";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from "@ui/button";
import SectionTitle from "@components/section-title";
import clsx from "clsx";
import { toast } from "react-toastify";
import { useWallet } from "@context/wallet-context";
import { toKB, textBytes, toKBAmount } from "@utils/methods";
import InscribeModal from "@components/modals/inscribe-modal";
import { MAX_FILE_SIZE } from "@lib/constants.config";

const Inscribor = ({ className, space }) => {
  const { ordinalsPublicKey, onShowConnectModal } = useWallet();

  const [message, setMessage] = useState();
  const [showInscribeModal, setShowInscribeModal] = useState(false);

  const handleInscribeModal = () => {
    setShowInscribeModal((prev) => !prev);
  };

  const LABEL_LIMIT_FILE = `Please pick a text smaller than ${toKB(
    MAX_FILE_SIZE,
    0,
  )}`;
  const textSize = textBytes(message);
  const availableKB = toKBAmount(MAX_FILE_SIZE - textSize);

  const sign = async () => {
    if (!message) {
      return;
    }

    try {
      setShowInscribeModal(true);
    } catch (e) {
      toast.error(e.message);
    }
  };

  function onWalletConnected() {
    setShowInscribeModal(true);
  }

  const messageOnChange = (evt) => {
    setMessage(evt.target.value);
  };

  const submit = async () => {
    if (!ordinalsPublicKey) {
      onShowConnectModal();
      return;
    }

    await sign();
  };

  return (
    <div
      id="inscribor"
      className={clsx(
        "rn-product-area",
        space === 1 && "rn-section-gapTop",
        className,
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12">
            <SectionTitle className="mb--0" {...{ title: `Inscribe text` }} />
          </div>
        </div>

        <div className="form">
          <InputGroup>
            <Form.Label>Inscribe text in the Bitcoin Blockchain</Form.Label>
            <Form.Control
              defaultValue={message}
              onChange={messageOnChange}
              placeholder="Enter your message to inscribe"
              aria-label="Enter your message to inscribe"
              aria-describedby="basic-addon2"
              autoFocus
              rows={10}
              as="textarea"
            />
            <p className="small footnote">
              {availableKB < 0 ? LABEL_LIMIT_FILE : toKB(textSize)}
            </p>
          </InputGroup>

          <div className="form-action">
            <Button size="medium" onClick={submit} disabled={!message}>
              Inscribe
            </Button>
          </div>
        </div>

        {!ordinalsPublicKey && <ConnectWallet callback={onWalletConnected} />}

        {showInscribeModal && (
          <InscribeModal
            show={showInscribeModal}
            handleModal={handleInscribeModal}
            message={message}
          />
        )}
      </div>
    </div>
  );
};

Inscribor.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
};

Inscribor.defaultProps = {
  space: 1,
};

export default Inscribor;
