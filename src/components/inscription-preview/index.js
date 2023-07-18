import { useState } from "react";
import PropTypes from "prop-types";
import { isImageInscription, ORDINALS_EXPLORER_URL } from "@services/nosft";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export const InscriptionPreview = ({ utxo }) => {
  const [loading, setLoading] = useState(true);

  const inscriptionId = utxo?.id || utxo?.inscriptionId;
  const handleLoad = () => {
    setLoading(false);
  };

  const renderImage = () => {
    if (!utxo) {
      return <Skeleton height={160} style={{ lineHeight: 3 }} />;
    }

    if (isImageInscription(utxo) || !inscriptionId) {
      let imgUrl = `${ORDINALS_EXPLORER_URL}/content/${inscriptionId}`;
      if (!inscriptionId) {
        imgUrl = "/images/logo/bitcoin.png";
      }
      return (
        <img src={imgUrl} alt={utxo.txId} onLoad={handleLoad} loading="lazy" />
      );
    }

    return (
      <iframe
        id={`iframe-${inscriptionId}`}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        title={inscriptionId}
        onLoad={handleLoad}
        src={`${ORDINALS_EXPLORER_URL}/content/${inscriptionId}`}
        style={{ visibility: loading ? "hidden" : "visible" }}
      />
    );
  };

  return (
    <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
      <div style={{ position: "relative" }}>{renderImage()}</div>
    </SkeletonTheme>
  );
};

InscriptionPreview.propTypes = {
  utxo: PropTypes.shape({
    content_type: PropTypes.string,
    inscriptionId: PropTypes.string,
    txId: PropTypes.string,
  }),
};
