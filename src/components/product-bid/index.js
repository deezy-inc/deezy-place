/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import { useWallet } from "@context/wallet-context";
import Button from "@ui/button";

const ProductBid = ({ price, utxo, confirmed, date, type, onClick }) => {
  function onActionClicked(e) {
    e.preventDefault();

    if (onClick) {
      onClick(utxo.inscriptionId);
      return;
    }

    window.location.href = `/inscription/${utxo.inscriptionId}`;
    return;
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
      <Button color="none" size="small" onClick={onActionClicked}>
        {label}
      </Button>
    );
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
  onClick: PropTypes.func,
};

export default ProductBid;
