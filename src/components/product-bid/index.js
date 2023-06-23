/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
// import { useState, useContext } from "react";
// import SendModal from "@components/modals/send-modal";
// import SellModal from "@components/modals/sell-modal";
// import BuyModal from "@components/modals/buy-modal";
import { useWallet } from "@context/wallet-context";
import Button from "@ui/button";

const ProductBid = ({ price, utxo, confirmed, date, type, onSale }) => {
  const { nostrAddress } = useWallet();

  // const [showSendModal, setShowSendModal] = useState(false);
  // const handleSendModal = () => {
  //     setShowSendModal((prev) => !prev);
  // };

  // const [showSellModal, setShowSellModal] = useState(false);
  // const handleSellModal = () => {
  //     setShowSellModal((prev) => !prev);
  // };

  // const [showBuyModal, setShowBuyModal] = useState(false);
  // const handleBuyModal = () => {
  //     setShowBuyModal((prev) => !prev);
  // };

  function renderMainAction(actionType) {
    if (!Boolean(nostrAddress)) {
      actionType = "view";
    }

    switch (actionType) {
      case "buy":
        return (
          <Button
            path={`/inscription/${utxo.inscriptionId}`}
            color="none"
            size="small"
          >
            Buy
          </Button>
        );
      case "sell":
        return (
          <Button
            path={`/inscription/${utxo.inscriptionId}`}
            color="none"
            size="small"
          >
            Sell
          </Button>
        );
      case "send":
        return (
          <Button
            path={`/inscription/${utxo.inscriptionId}`}
            color="none"
            size="small"
          >
            Send
          </Button>
        );
      case "view":
        return (
          <Button
            path={`/inscription/${utxo.inscriptionId}`}
            color="none"
            size="small"
          >
            View
          </Button>
        );
      default:
        return <span />;
    }
  }
  const minted = !confirmed
    ? "Unconfirmed"
    : new Date(date * 1000).toLocaleString();
  const sats = `${price.amount} ${price.currency}`;
  const textPrice = type === "buy" ? `Listed for: ${sats}` : sats;

  return (
    <div className="bid-react-area">
      <div className="last-bid">
        {utxo.name || textPrice}
        <span className="minted">{` ${minted}`}</span>
      </div>

      {renderMainAction(type)}

      {/* <SendModal show={showSendModal} handleModal={handleSendModal} utxo={utxo} onSale={onSale} /> */}

      {/* <SellModal show={showSellModal} handleModal={handleSellModal} utxo={utxo} onSale={onSale} /> */}

      {/* <BuyModal show={showBuyModal} handleModal={handleBuyModal} utxo={utxo} onSale={onSale} /> */}
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
