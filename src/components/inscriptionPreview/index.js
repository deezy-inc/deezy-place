import { useState } from "react";
import { TailSpin } from "react-loading-icons";
import PropTypes from "prop-types";
import { ORDINALS_EXPLORER_URL } from "@lib/constants";

export const InscriptionPreview = ({ utxo }) => {
    const [loading, setLoading] = useState(true);

    const isImage = /(^image)(\/)[a-zA-Z0-9_]*/gm.test(utxo.content_type);
    const handleLoad = () => {
        setLoading(false);
    };

    const renderImage = () => {
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
        <div style={{ position: "relative" }}>
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                    }}
                >
                    <div className="ordinal-loader">
                        <TailSpin stroke="#fec823" speed={0.75} />
                    </div>
                </div>
            )}

            {renderImage()}
        </div>
    );
};

InscriptionPreview.propTypes = {
    utxo: PropTypes.shape({
        content_type: PropTypes.string.isRequired,
        inscriptionId: PropTypes.string,
        txId: PropTypes.string,
    }),
};
