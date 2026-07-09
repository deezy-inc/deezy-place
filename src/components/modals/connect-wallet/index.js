/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Image from "next/image";
import { useWallet } from "@context/wallet-context";
import NostrKey, { NOSTR_PROVIDER } from "@lib/nosft-core/services/nostr-key";
import NostrKeyModal from "@components/modals/nostr-key-modal";

// Gets the callback function from the parent component to notify when the wallet get's connecteds
const ConnectWallet = ({ callback }) => {
  const {
    onConnectHandler: onConnect,
    showConnectModal: show,
    onHideConnectModal,
  } = useWallet();
  const [showNostrKeyEntry, setShowNostrKeyEntry] = useState(false);

  useEffect(() => {
    if (!show) {
      setShowNostrKeyEntry(false);
    }
  }, [show]);

  const onNostrKeySubmit = ({ value }) => {
    // Throws with a user-facing message on invalid input, which the key
    // modal displays inline
    NostrKey.connectPrivateKey(value);
    setShowNostrKeyEntry(false);
    onConnect(NOSTR_PROVIDER, callback);
  };

  // Only providers the unified (bulk) send flow can sign with are offered;
  // MetaMask/Ordswap/Generative/UniSat/Xverse were removed when the single
  // send flow was retired
  const wallets = [
    {
      name: "Alby",
      image: "/images/logo/alby.svg",

      onClick: () => {
        onConnect("alby", callback);
      },
    },
    {
      name: "Raw Nostr Key",
      image: "/images/logo/nostr.svg",
      onClick: () => {
        setShowNostrKeyEntry(true);
      },
    },
  ];

  const getWallets = () => wallets;

  if (showNostrKeyEntry) {
    return (
      <NostrKeyModal
        show={show}
        onHide={() => setShowNostrKeyEntry(false)}
        onSubmit={onNostrKeySubmit}
      />
    );
  }

  return (
    <Modal
      className="rn-popup-modal placebid-modal-wrapper"
      show={show}
      onHide={onHideConnectModal}
      centered
    >
      {show && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onHideConnectModal}
        >
          <i className="feather-x" />
        </button>
      )}
      <Modal.Header>
        <h3 className="modal-title">Choose your wallet</h3>
      </Modal.Header>
      <Modal.Body>
        <div className="wallet-list-container">
          <div className="wallet-list">
            {getWallets().map((wallet) => (
              <button
                type="button"
                className="wallet"
                key={wallet.name}
                onClick={wallet.onClick}
              >
                <div className="wallet-img-container">
                  <Image
                    width={35}
                    height={35}
                    src={wallet.image}
                    alt={`wallet-${wallet.name}-logo`}
                  />
                </div>

                <p>{wallet.name}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

ConnectWallet.propTypes = {
  callback: PropTypes.func,
};

export default ConnectWallet;
