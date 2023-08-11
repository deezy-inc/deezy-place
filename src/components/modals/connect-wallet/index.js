/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Image from "next/image";
import { useWallet } from "@context/wallet-context";

// Gets the callback function from the parent component to notify when the wallet get's connecteds
const ConnectWallet = ({ callback }) => {
  const {
    ethProvider,
    onConnectHandler: onConnect,
    showConnectModal: show,
    onHideConnectModal,
  } = useWallet();

  const wallets = [
    {
      name: "MetaMask",
      image: "/images/logo/metamask.png",
      ethereum: true,

      onClick: () => {
        onConnect("nosft.xyz", callback);
      },
    },
    {
      name: "Ordswap",
      image: "/images/logo/ordswap.svg",
      ethereum: true,

      onClick: () => {
        onConnect("ordswap.io", callback);
      },
    },
    {
      name: "Generative",
      image: "/images/logo/generative.png",
      ethereum: true,

      onClick: () => {
        onConnect("generative.xyz", callback);
      },
    },
    {
      name: "UniSat",
      image: "/images/logo/unisat.png",
      provider: "unisat",
      onClick: () => {
        onConnect("unisat.io", callback);
      },
    },
    {
      name: "Alby",
      image: "/images/logo/alby.svg",

      onClick: () => {
        onConnect("alby", callback);
      },
    },
    {
      name: "Xverse",
      image: "/images/logo/xverse.png",
      provider: "xverse",
      onClick: () => {
        onConnect("xverse", callback);
      },
    },
  ];

  const getWallets = () => {
    const activeWallets = [];
    wallets.forEach((wallet) => {
      if (typeof window === "undefined") return;
      if (
        (wallet.provider === "xverse" && !window.BitcoinProvider) ||
        (!ethProvider && wallet.ethereum) ||
        (wallet.provider === "unisat" && !window.unisat)
      ) {
        return;
      }
      activeWallets.push(wallet);
    });
    return activeWallets;
  };

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
