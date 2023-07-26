/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useWallet } from "@context/wallet-context";
import Button from "@ui/button";
import { satToBtc } from "@services/nosft";

const ProductBid = ({
  price,
  utxo,
  confirmed,
  date,
  type,
  onSale,
  onClick,
}) => {
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

  // remove commas and from price.amount
  const priceAmount = price?.amount?.replace(/,/g, "") || 0;
  const sats = satToBtc(Number(priceAmount));
  const textPrice = type === "buy" ? `Listed for: ${sats}` : sats;

  const renderLabelInfo = () => {
    if (type === "buy") {
      return (
        <>
          <img
            src="/images/logo/bitcoin.png"
            height={19}
            alt={`${textPrice} btc`}
          />
          <p>{sats}</p>
        </>
      );
    }

    return <span className="not-for-sale">Not for sale</span>;
  };

  // function onWalletConnected() {
  //   setShowBuyModal(true);
  // }

  return (
    <div className="bid-react-area">
      <div className="last-bid">
        {renderLabelInfo()}
        {/* {utxo.name || textPrice} */}
        {/* <span className="minted">{` ${minted}`}</span> */}
      </div>

      {/* {!nostrOrdinalsAddress && <ConnectWallet cb={onWalletConnected} />} */}

      {renderMainAction(type)}

      {/* {showBuyModal && (
        <BuyModal
          show={showBuyModal}
          handleModal={handleBuyModal}
          utxo={utxo}
          onSale={() => {
            window.location.href = `/inscription/${utxo.inscriptionId}`;
          }}
          nostr={utxo.nostr}
        />
      )} */}
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
  onClick: PropTypes.func,
};

export default ProductBid;
