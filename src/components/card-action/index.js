/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import Button from "@ui/button";

// Marketplace-era name was ProductBid; with buying/selling retired this now
// only renders the utxo's sats value and a View button navigating to the
// detail page
const CardAction = ({ price, utxo, onClick, alwaysNewTabOnView }) => {
  function onActionClicked(e) {
    e.preventDefault();

    if (onClick) {
      onClick(utxo.inscriptionId);
      return;
    }

    const path = utxo?.inscriptionId
      ? `/inscription/${utxo?.inscriptionId}`
      : `/output/${utxo?.txid}:${utxo?.vout}`;

    // Check if command/ctrl key is pressed for new tab
    if (e.metaKey || e.ctrlKey || alwaysNewTabOnView) {
      window.open(path, "_blank");
    } else {
      window.location.href = path;
    }
  }

  // price.amount is the utxo value in sats, already comma-formatted
  const satsLabel = price?.amount ? `${price.amount} sats` : "";

  return (
    <div className="bid-react-area">
      <div className="last-bid">
        <span className="without-price">{satsLabel}</span>
      </div>
      <Button color="primary-alta" size="small" onClick={onActionClicked}>
        View
      </Button>
    </div>
  );
};

CardAction.propTypes = {
  price: PropTypes.shape({
    amount: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  utxo: PropTypes.object,
  onClick: PropTypes.func,
  alwaysNewTabOnView: PropTypes.bool,
};

export default CardAction;
