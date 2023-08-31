/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import Button from "@ui/button";
import { satToBtc } from "@services/nosft";

const ProductBid = ({ price, utxo, confirmed, date, type, onClick }) => {
  function onActionClicked(e) {
    e.preventDefault();

    if (onClick) {
      onClick(utxo.inscriptionId);
      return;
    }

    const path = utxo?.inscriptionId
      ? `/inscription/${utxo?.inscriptionId}`
      : `/output/${utxo?.txid}:${utxo?.vout}`;

    window.location.href = path;
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
  const priceAmount = price?.amount?.replace(/,/g, "") || 0;
  const btcValue = satToBtc(Number(priceAmount));
  const textPrice = type === "buy" ? `Listed for: ${btcValue}` : btcValue;

  const renderLabelInfo = () => {
    if (type === "buy") {
      return (
        <>
          <img
            src="/images/logo/bitcoin.png"
            height={19}
            alt={`${textPrice} btc`}
          />
          <p>{btcValue}</p>
        </>
      );
    }

    return <span className="without-price">{minted}</span>;
  };

  return (
    <div className="bid-react-area">
      <div className="last-bid">{renderLabelInfo()}</div>

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
