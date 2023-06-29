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
import {
  getInscriptions,
  satsToFormattedDollarString,
  shortenStr,
} from "@services/nosft";
import OrdinalFilter from "@components/ordinal-filter";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { useWallet } from "@context/wallet-context";
import Slider, { SliderItem } from "@ui/slider";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";

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

const WalletArea = ({
  className,
  space,
  displayOnlyInscriptions,
  showOnlyOrdinals = true,
}) => {
  const { nostrOrdinalsAddress } = useWallet();
  const [balance, setBalance] = useState(0);
  const [utxosReady, setUtxosReady] = useState(false);
  const [ownedUtxos, setOwnedUtxos] = useState([]);
  const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
  const [refreshHack, setRefreshHack] = useState(false);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const handleRefreshHack = () => {
    setRefreshHack(!refreshHack);
  };

  const onCopyAddress = () => {
    navigator.clipboard.writeText(nostrOrdinalsAddress);
    toast("Receive Address copied to clipboard!");
  };

  useMemo(() => {
    const filteredUtxos = applyFilters({
      showOnlyOrdinals: false,
      utxos: ownedUtxos,
    });
    setFilteredOwnedUtxos(filteredUtxos);
  }, [ownedUtxos]);

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
        setBalance(
          utxosWithInscriptionData.reduce((acc, utxo) => acc + utxo.value, 0)
        );
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
        "wallet",
        space === 1 && "rn-section-gapTop",
        className
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-4 col-md-6 col-sm-6 col-12">
            <div className="wallet-title">
              <SectionTitle
                className="mb--0"
                {...{ title: "Available Balance" }}
                isLoading={!utxosReady}
              />
              {!!balance && (
                <span className="balance-info">
                  <span className="price">
                    ${satsToFormattedDollarString(balance, bitcoinPrice)}
                  </span>
                </span>
              )}
            </div>

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
          </div>
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

WalletArea.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  onSale: PropTypes.func,
  displayOnlyInscriptions: PropTypes.bool,
  hideAddress: PropTypes.bool,
};

WalletArea.defaultProps = {
  space: 1,
};

export default WalletArea;
