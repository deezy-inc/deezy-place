/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast, react/no-array-index-key */
import { useMemo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import Image from "next/image";
import { getInscriptions, shortenStr } from "@services/nosft";
import OrdinalFilter from "@components/ordinal-filter";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { useWallet } from "@context/wallet-context";
import Slider, { SliderItem } from "@ui/slider";

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

const OrdinalsArea = ({
  className,
  space,
  displayOnlyInscriptions,
  hideAddress,
}) => {
  const { nostrOrdinalsAddress } = useWallet();

  const [utxosReady, setUtxosReady] = useState(false);
  const [ownedUtxos, setOwnedUtxos] = useState([]);
  const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
  const [showOnlyOrdinals, setShowOnlyOrdinals] = useState(true);
  const [refreshHack, setRefreshHack] = useState(false);

  const [activeSort, setActiveSort] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);

  const handleRefreshHack = () => {
    setRefreshHack(!refreshHack);
  };

  const onCopyAddress = () => {
    navigator.clipboard.writeText(nostrOrdinalsAddress);
    toast("Receive Address copied to clipboard!");
  };

  useMemo(() => {
    const filteredUtxos = applyFilters({
      showOnlyOrdinals,
      utxos: ownedUtxos,
      activeSort,
      sortAsc,
    });
    setFilteredOwnedUtxos(filteredUtxos);
  }, [ownedUtxos, activeSort, sortAsc, showOnlyOrdinals]);

  const resetUtxos = () => {
    setOwnedUtxos([]);
    setFilteredOwnedUtxos([]);
    setUtxosReady(true);
  };

  useEffect(() => {
    if (!nostrOrdinalsAddress) {
      resetUtxos();
      return;
    }

    const loadUtxos = async () => {
      setUtxosReady(false);

      let utxosWithInscriptionData = [];

      try {
        utxosWithInscriptionData = await getInscriptions(nostrOrdinalsAddress);
        if (displayOnlyInscriptions) {
          utxosWithInscriptionData = utxosWithInscriptionData.filter(
            (utxo) => !!utxo.inscriptionId
          );
        }
      } catch (error) {
        console.error(error);
        // TODO: handle error
      }

      setOwnedUtxos(utxosWithInscriptionData);
      setFilteredOwnedUtxos(utxosWithInscriptionData);
      setUtxosReady(true);
    };

    loadUtxos();
  }, [refreshHack, nostrOrdinalsAddress]);

  return (
    <div
      id="your-collection"
      className={clsx(
        "rn-product-area",
        space === 1 && "rn-section-gapTop",
        className
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-4 col-md-6 col-sm-6 col-12">
            <SectionTitle
              className="mb--0"
              {...{ title: "Your collection" }} //
              isLoading={!utxosReady}
            />
            {!hideAddress && (
              <>
                <br />
                <span>
                  <Image
                    src="/images/logo/ordinals-white.svg"
                    alt="Ordinal"
                    width={15}
                    height={15}
                    className="mb-1"
                    priority
                  />
                  <button
                    type="button"
                    className="btn-transparent"
                    onClick={onCopyAddress}
                  >
                    {" "}
                    {shortenStr(nostrOrdinalsAddress)}
                  </button>
                </span>
              </>
            )}
          </div>
          {ownedUtxos.length > 0 && (
            <div className="col-lg-8 col-md-6 col-sm-6 col-6">
              <OrdinalFilter
                ownedUtxos={ownedUtxos}
                setFilteredOwnedUtxos={setFilteredOwnedUtxos}
                setActiveSort={setActiveSort}
                setSortAsc={setSortAsc}
                activeSort={activeSort}
                sortAsc={sortAsc}
                showOnlyOrdinals={showOnlyOrdinals}
                setShowOnlyOrdinals={setShowOnlyOrdinals}
              />
            </div>
          )}
        </div>

        <div className="row g-5">
          {utxosReady && ownedUtxos.length > 0 && (
            <>
              {filteredOwnedUtxos.map((inscription) => (
                <div
                  key={inscription.txid}
                  className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                >
                  <OrdinalCard
                    overlay
                    price={{
                      amount: inscription.value.toLocaleString("en-US"),
                      currency: "Sats",
                    }}
                    type="send"
                    confirmed={inscription.status.confirmed}
                    date={inscription.status.block_time}
                    authors={collectionAuthor}
                    utxo={inscription}
                    onSale={handleRefreshHack}
                  />
                </div>
              ))}
              {filteredOwnedUtxos.length === 0 && (
                <div className="col-12">
                  <div className="text-center">
                    <h3>No results found</h3>
                  </div>
                </div>
              )}
            </>
          )}

          {utxosReady && ownedUtxos.length === 0 && (
            <div>
              This address does not own anything yet..
              <br />
            </div>
          )}

          {!utxosReady && (
            <Slider options={SliderOptions} className="slick-gutter-15">
              {[...Array(5)].map((_, index) => (
                <SliderItem key={index} className="ordinal-slide">
                  <OrdinalCard overlay />
                </SliderItem>
              ))}
            </Slider>
          )}
        </div>
      </div>
    </div>
  );
};

OrdinalsArea.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  onSale: PropTypes.func,
  displayOnlyInscriptions: PropTypes.bool,
  hideAddress: PropTypes.bool,
};

OrdinalsArea.defaultProps = {
  space: 1,
};

export default OrdinalsArea;
