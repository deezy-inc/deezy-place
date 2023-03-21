import { useState } from "react";
import { TailSpin } from "react-loading-icons";
import PropTypes from "prop-types";
import { ORDINALS_EXPLORER_URL } from "@lib/constants";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export const InscriptionPreview = ({ utxo }) => {
    const [loading, setLoading] = useState(true);

    const handleLoad = () => {
        setLoading(false);
    };

    const renderImage = () => {
        if (!utxo) {
            return <Skeleton height={160} style={{ lineHeight: 3 }} />;
        }

        const isImage = /(^image)(\/)[a-zA-Z0-9_]*/gm.test(utxo.content_type);
        if (isImage) {
            return (
                <img
                    src={`${ORDINALS_EXPLORER_URL}/content/${utxo.inscriptionId}`}
                    alt={utxo.txId}
                    onLoad={handleLoad}
                    loading="lazy"
                />
            );
        }

        return (
            <iframe
                id={`iframe-${utxo.inscriptionId}`}
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
                title={utxo.inscriptionId}
                onLoad={handleLoad}
                src={`${ORDINALS_EXPLORER_URL}/content/${utxo.inscriptionId}`}
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
        content_type: PropTypes.string.isRequired,
        inscriptionId: PropTypes.string,
        txId: PropTypes.string,
    }),
};
