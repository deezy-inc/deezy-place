/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import { useState, useEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import { InscriptionPreview } from "@components/inscription-preview";
import ProductTitle from "@components/product-details/title";
import RuneDisplay from "@components/rune-display";
import SendModal from "@components/modals/send-modal";
import InscriptionCollection from "@components/product-details/collection";
import { useWallet } from "@context/wallet-context";
import { shortenStr } from "@services/nosft";

export const toBTC = (sats) => parseFloat((sats / 100000000).toFixed(8));

const SatsRangeTable = ({ product }) => {
  const satRanges = product?.sat_ranges;
  console.log("[SatsRangeTable] product:", product);
  console.log("[SatsRangeTable] satRanges:", satRanges);

  return (
    <div className="container my-5 uninscribed-sats">
      {satRanges && (
        <Table responsive="md" className="table-dark table-hover">
          <thead>
            <tr>
              <th>Name Range</th>
              <th>Number Range</th>
              <th>Satributes</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(
              { length: Math.ceil(satRanges.length / 2) },
              (_, i) => i * 2,
            ).map((index) => {
              const firstSat = satRanges[index];
              const secondSat = satRanges[index + 1];

              const rarity = firstSat?.rarity;

              return (
                <tr key={index}>
                  <td>{`${firstSat?.name} - ${secondSat?.name}`}</td>
                  <td>{`${firstSat?.number} - ${secondSat?.number}`}</td>
                  <td>
                    <Badge
                      pill
                      variant={rarity === "common" ? "primary" : "warning"}
                    >
                      {rarity.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const ProductDetailsArea = memo(
  ({ space, className, inscription = {}, uninscribedSats, collection }) => {
    const product = useMemo(() => {
      if (!inscription && !uninscribedSats) return {};
      return {
        title: uninscribedSats
          ? `Output ${shortenStr(uninscribedSats.output)}`
          : `Inscription #${inscription.num}`,
        num: uninscribedSats ? "" : inscription.num,
        owner: uninscribedSats ? uninscribedSats.address : inscription.owner,
        minted: uninscribedSats
          ? ""
          : new Date(inscription.created * 1000).toLocaleString("en-US") || "-",
        content_type: uninscribedSats ? "" : inscription.content_type,
        content_length: uninscribedSats
          ? ""
          : `${inscription.content_length} bytes`,
        genesis_fee: uninscribedSats ? "" : inscription.genesis_fee,
        genesis_height: uninscribedSats ? "" : inscription.genesis_height,
        id: uninscribedSats ? "" : shortenStr(inscription.id),
        shorten_owner: uninscribedSats
          ? shortenStr(uninscribedSats.address)
          : shortenStr(inscription.owner),
        value: uninscribedSats ? uninscribedSats.value : inscription.value,
        btcValue: uninscribedSats ? `${toBTC(uninscribedSats.value)} BTC` : "",
        output: uninscribedSats ? shortenStr(uninscribedSats.output) : "",
        sat_ranges: uninscribedSats ? uninscribedSats.sat_ranges : "",
        runes: uninscribedSats ? uninscribedSats.runes : [],
      };
    }, [inscription, uninscribedSats]);
    const { nostrOrdinalsAddress, ordinalsPublicKey } = useWallet();
    const [showSendModal, setShowSendModal] = useState(false);

    const handleSendModal = () => {
      setShowSendModal((prev) => !prev);
    };

    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
      if (!nostrOrdinalsAddress || !inscription) return;
      setIsOwner(
        nostrOrdinalsAddress &&
        product.owner &&
        nostrOrdinalsAddress === product.owner,
      );
    }, [nostrOrdinalsAddress, product]);

    const properties = [
      {
        id: 8,
        type: "Owner",
        value: product.shorten_owner,
      },
      {
        id: 9,
        type: "Output",
        value: product.output,
      },
      {
        id: 10,
        type: "Value",
        value: product.btcValue,
      },
      {
        id: 7,
        type: "Inscription Id",
        value: product.id,
      },

      {
        id: 1,
        type: "Content Type",
        value: product.content_type,
      },
      {
        id: 2,
        type: "Content Length",
        value: product.content_length,
      },

      {
        id: 4,
        type: "Genesis Height",
        value: product.genesis_height,
      },
      {
        id: 5,
        type: "Genesis Fee",
        value: product.genesis_fee,
      },
      {
        id: 6,
        type: "Minted",
        value: product.minted,
      },
    ];

    const isWalletConnected = ordinalsPublicKey && nostrOrdinalsAddress;

    const onSend = () => { };

    const shouldShowSend = isOwner && isWalletConnected;

    return (
      <div className={clsx("", space === 1 && "rn-section-gapTop", className)}>
        <div className="container">
          <div className="inscription-wrapper g-5">
            <div className="product-details">
              <div className="rn-pd-thumbnail">
                <InscriptionPreview utxo={inscription} />
              </div>
            </div>

            <div className=" mt_md--50 mt_sm--60">
              <div className="rn-pd-content-area">
                <ProductTitle title={product.title} likeCount={30} />

                {product.sat_ranges && <SatsRangeTable product={product} />}

                {product.runes && product.runes.length > 0 && (
                  <div className="container my-5">
                    <h6 className="pd-property-title mb-3">Runes</h6>
                    <RuneDisplay runes={product.runes} />
                  </div>
                )}

                {
                  collection && (
                    <div className="catagory-collection">
                      <InscriptionCollection collection={collection} />
                    </div>
                  )
                }

                {shouldShowSend && (
                  <div className="rn-pd-sm-property-wrapper">
                    <h6 className="pd-property-title">Actions</h6>

                    <div className="inscription-actions">
                      <button
                        className="pd-react-area btn-transparent"
                        type="button"
                        onClick={handleSendModal}
                      >
                        <div className="action">
                          <i className="feather-send" />
                          <span>Send</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <hr className="mt--20" />

                <div className="rn-pd-bd-wrapper">
                  <div className="rn-pd-sm-property-wrapper">
                    <div className="property-wrapper">
                      {properties
                        .filter((p) => p.value)
                        .map((property) => (
                          <div
                            key={`${property.id}-${property.type}-${property.value}`}
                            className="pd-property-inner"
                          >
                            <span className="color-body type">
                              {property.type}
                            </span>
                            <span className="color-white value">{`${property.value}`}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSendModal && (
          <SendModal
            show={showSendModal}
            handleModal={handleSendModal}
            utxo={uninscribedSats || inscription}
            isUninscribed={!!uninscribedSats}
            onSend={onSend}
          />
        )}
      </div>
    );
  },
);

ProductDetailsArea.propTypes = {
  space: PropTypes.oneOf([1, 2]),
  className: PropTypes.string,
  inscription: PropTypes.any,
  uninscribedSats: PropTypes.any,
  collection: PropTypes.any,
};

ProductDetailsArea.defaultProps = {
  space: 1,
};

export default ProductDetailsArea;
