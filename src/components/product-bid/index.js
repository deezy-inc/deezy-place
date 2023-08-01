/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import { useWallet } from "@context/wallet-context";
import Button from "@ui/button";
import { satToBtc } from "@services/nosft";

const ProductBid = ({ price, utxo, confirmed, date, type }) => {
  const { nostrOrdinalsAddress } = useWallet();

  function renderMainAction(actionType) {
    if (!Boolean(nostrOrdinalsAddress)) {
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
};

export default ProductBid;
