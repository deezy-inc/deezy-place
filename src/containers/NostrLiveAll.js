/* eslint-disable react/no-array-index-key */

import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalFilter from "@components/ordinal-filter";
import OrdinalCard from "@components/ordinal-card";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { DEFAULT_UTXO_OPTIONS } from "@lib/constants.config";
import { useWallet } from "@context/wallet-context";
import ConnectWallet from "@components/modals/connect-wallet";
import BuyModal from "@components/modals/buy-modal";
import { useOfferFilters } from "@hooks";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { useDebounce } from "react-use";
import LoadingAnimation from "@components/loading-animation";

const NostrLive = ({ className, space, type, openOrders, loading = true }) => {
  const { nostrOrdinalsAddress, onShowConnectModal } = useWallet();
  const [clickedUtxo, setClickedUtxo] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const [showNoResults, setShowNoResults] = useState(false);

  const {
    activeSort,
    setActiveSort,
    sortAsc,
    setSortAsc,
    searchQuery,
    setSearchQuery,
    utxosType,
    setUtxosType,
  } = useOfferFilters(type);

  const handleBuyModal = () => {
    setShowBuyModal((prev) => !prev);
  };

  function onWalletConnected() {
    setShowBuyModal(true);
  }

  function onCardClicked(id) {
    const inscriptionClicked = openOrders.find((i) => i.sig === id);
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

  const filteredUtxos = useMemo(() => {
    return applyFilters({
      utxos: openOrders,
      activeSort,
      sortAsc,
      utxosType,
      searchQuery,
    });
  }, [openOrders, activeSort, sortAsc, utxosType, searchQuery]);

  useDebounce(
    () => {
      setShowNoResults(filteredUtxos.length === 0 && !loading);
    },
    1000,
    [filteredUtxos, loading],
  );

  console.log({
    openOrders: openOrders.length,
    filteredUtxos: filteredUtxos.length,
    loading,
  });

  return (
    <div
      id="your-collection"
      className={clsx(
        "rn-product-area",
        space === 1 && "rn-section-gapTop",
        className,
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12">
            <SectionTitle
              className="mb--0"
              title={type === "bidding" ? "Auctions" : "On Sale"}
              isLoading={false}
            />
          </div>
          <div className="col-lg-6 col-md-6 col-sm-6 col-12">
            <OrdinalFilter
              setActiveSort={setActiveSort}
              setSortAsc={setSortAsc}
              activeSort={activeSort}
              sortAsc={sortAsc}
              setUtxosType={setUtxosType}
              setSearchQuery={setSearchQuery}
              searchQuery={searchQuery}
              utxosOptions={DEFAULT_UTXO_OPTIONS}
              utxosType={utxosType}
            />
          </div>
        </div>
        <div className="row g-5 live-offers">
          {loading ? (
            <div className="col-12">
              <div className="text-center">
                <LoadingAnimation />
              </div>
            </div>
          ) : (
            <TransitionGroup component={null}>
              {openOrders.length > 0 &&
                filteredUtxos.map((inscription) => (
                  <CSSTransition
                    key={inscription.sig}
                    timeout={300}
                    classNames="item"
                  >
                    <div className="col-5 col-lg-4 col-md-6 col-sm-6 col-12">
                      <OrdinalCard
                        overlay
                        price={{
                          amount: inscription.value.toLocaleString("en-US"),
                          currency: "Sats",
                        }}
                        type="buy"
                        confirmed
                        date={inscription.created_at}
                        authors={collectionAuthor}
                        utxo={inscription}
                        onClick={() => onCardClicked(inscription.sig)}
                      />
                    </div>
                  </CSSTransition>
                ))}
            </TransitionGroup>
          )}

          {showNoResults && (
            <div className="col-12">
              <div className="text-center">
                <h3>No results found</h3>
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
};

NostrLive.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  type: PropTypes.oneOf(["live", "bidding", "my-bidding"]),
  address: PropTypes.string,
};

NostrLive.defaultProps = {
  space: 1,
  type: "live",
};

export default NostrLive;
