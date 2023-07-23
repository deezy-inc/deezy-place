/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useWallet } from "@context/wallet-context";
import Button from "@ui/button";
import { satToBtc } from "@services/nosft";
import ConnectWallet from "@components/modals/connect-wallet";
import BuyModal from "@components/modals/buy-modal";

const ProductBid = ({ price, utxo, confirmed, date, type, onSale }) => {
  const { nostrOrdinalsAddress, onShowConnectModal } = useWallet();
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleBuyModal = () => {
    setShowBuyModal((prev) => !prev);
  };

  function buttonAction() {
    if (type !== "buy") {
      window.location.href = `/inscription/${utxo.inscriptionId}`;
      return;
    }

    if (!nostrOrdinalsAddress) {
      onShowConnectModal();
    } else {
      setShowBuyModal(true);
    }
  }
  function renderMainAction(actionType) {
    let label = "View";
    switch (actionType) {
      case "buy":
        label = "Buy";
        break;
      case "sell":
        label = "Sell";
        break;
      case "send":
        label = "Send";
      case "view":
        label = "View";
      default:
        label = "View";
    }

    return (
      <Button color="none" size="small" onClick={buttonAction}>
        {label}
      </Button>
    );
  }
  const minted = !confirmed
    ? "Unconfirmed"
    : new Date(date * 1000).toLocaleString();

  // remove commas and from price.amount
  const priceAmount = price?.amount?.replace(/,/g, "") || 0;
  const sats = satToBtc(Number(priceAmount));
  const textPrice = type === "buy" ? `Listed for: ${sats}` : sats;

  function onWalletConnected() {
    setShowBuyModal(true);
  }

  return (
    <div className="bid-react-area">
      <div className="last-bid">
        <img
          src="/images/logo/bitcoin.png"
          height={19}
          alt={`${textPrice} btc`}
        />
        <p>{sats}</p>
        {/* {utxo.name || textPrice} */}
        {/* <span className="minted">{` ${minted}`}</span> */}
      </div>

      <ConnectWallet cb={onWalletConnected} />
      {renderMainAction(type)}

      {showBuyModal && (
        <BuyModal
          show={showBuyModal}
          handleModal={handleBuyModal}
          utxo={utxo}
          onSale={() => {
            window.location.href = `/inscription/${utxo.inscriptionId}`;
          }}
          nostr={utxo.nostr}
        />
      )}
    </div>
  );
};

ProductBid.propTypes = {
  price: PropTypes.shape({
    amount: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  utxo: PropTypes.object,
  confirmed: PropTypes.bool,
  date: PropTypes.number,
  type: PropTypes.oneOf(["buy", "sell", "send", "view"]).isRequired,
  onSale: PropTypes.func,
};

export default ProductBid;
