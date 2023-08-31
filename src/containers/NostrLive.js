/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import Slider, { SliderItem } from "@ui/slider";
import OrdinalCard from "@components/ordinal-card";
import Anchor from "@ui/anchor";
import { useWallet } from "@context/wallet-context";
import ConnectWallet from "@components/modals/connect-wallet";
import BuyModal from "@components/modals/buy-modal";

const collectionAuthor = [
  {
    name: "Danny Deezy",
    slug: "/deezy",
    image: {
      src: "/images/logo/nos-ft-logo.png",
    },
  },
];

const SliderOptions = {
  infinite: true,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  speed: 4000,
  responsive: [
    {
      breakpoint: 1399,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 992,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

const NostrLive = ({ className, space, type, openOffers }) => {
  const { nostrOrdinalsAddress, onShowConnectModal } = useWallet();
  const [clickedUtxo, setClickedUtxo] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleBuyModal = () => {
    setShowBuyModal((prev) => !prev);
  };

  function onWalletConnected() {
    setShowBuyModal(true);
  }

  function onCardClicked(id) {
    const inscriptionClicked = openOffers.find((i) => i.inscriptionId === id);
    if (!inscriptionClicked) {
      return;
    }

    setClickedUtxo(inscriptionClicked);

    if (!nostrOrdinalsAddress) {
      onShowConnectModal();
    } else {
      setShowBuyModal(true);
    }
  }

  const handleRefreshHack = () => {
    setRefreshHack(!refreshHack);
  };

  const renderCards = () => {
    if (openOffers.length) {
      return openOffers.map((utxo) => (
        <SliderItem key={utxo.txid} className="ordinal-slide">
          <OrdinalCard
            overlay
            price={{
              amount: utxo.value.toLocaleString("en-US"),
              currency: "Sats",
            }}
            type="buy"
            confirmed
            date={utxo.created_at}
            authors={collectionAuthor}
            utxo={utxo}
            onSale={handleRefreshHack}
            onClick={onCardClicked}
          />
        </SliderItem>
      ));
    }

    return (
      <>
        {type === "bidding"
          ? "No dutch auction yet."
          : "No ordinals for sale yet."}
      </>
    );
  };

  return (
    <div className={clsx(space === 1 && "rn-section-gapTop", className)}>
      <div className="container">
        <div className="row mb--20">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12 mt_mobile--15">
            <SectionTitle
              className="mb--0 live-title"
              {...{ title: type === "bidding" ? "Live Auction" : "On Sale" }}
            />
          </div>

          <div className="col-lg-6 col-md-6 col-sm-6 col-12 mt--15">
            <div className="view-more-btn text-start text-sm-end ">
              <Anchor
                className="btn-transparent"
                path={type === "live" ? "/marketplace" : "/auction"}
              >
                VIEW ALL
                <i className="feather-arrow-right mb-md-5" />
              </Anchor>
            </div>
          </div>
        </div>

        {!nostrOrdinalsAddress && (
          <ConnectWallet callback={onWalletConnected} />
        )}
        {showBuyModal && clickedUtxo && (
          <BuyModal
            show={showBuyModal}
            handleModal={handleBuyModal}
            utxo={clickedUtxo}
            onSale={() => {
              window.location.href = `/inscription/${clickedUtxo.inscriptionId}`;
            }}
            nostr={clickedUtxo.nostr}
          />
        )}

        <div className="row">
          <div className="col-lg-12">
            <Slider options={SliderOptions} className="slick-gutter-15">
              {renderCards()}
            </Slider>
          </div>
        </div>
      </div>
    </div>
  );
};

NostrLive.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  type: PropTypes.oneOf(["bidding", "live"]),
};

NostrLive.defaultProps = {
  space: 1,
  type: "live",
};

export default NostrLive;
