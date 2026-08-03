import { useState } from "react";
import PropTypes from "prop-types";
import { isImageInscription, ORDINALS_EXPLORER_URL } from "@services/nosft";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const INSCRIPTION_ID_REGEX = /^[a-f0-9]{64}i[0-9]+$/;

export const InscriptionPreview = ({ utxo }) => {
    const [loading, setLoading] = useState(true);
    // Non-image inscriptions (HTML/JS, PDFs, etc.) load only on explicit user
    // action: anyone can send an arbitrary-content inscription to any wallet,
    // so auto-rendering them lets an attacker run script inside the page the
    // moment a victim opens their wallet (drive-by phishing)
    const [interactiveLoad, setInteractiveLoad] = useState(false);

    const handleLoad = () => {
        setLoading(false);
    };

    const renderImage = () => {
        if (!utxo) {
            return <Skeleton height={160} style={{ lineHeight: 3 }} />;
        }

        if (isImageInscription(utxo) || !utxo.inscriptionId) {
            let imgUrl = `${ORDINALS_EXPLORER_URL}/content/${utxo.inscriptionId}`;
            if (!utxo.inscriptionId) {
                imgUrl = "/images/logo/bitcoin.png";
            }
            return <img src={imgUrl} alt={utxo.txId} onLoad={handleLoad} loading="lazy" />;
        }

        // Never interpolate an unvalidated id into the content URL
        if (!INSCRIPTION_ID_REGEX.test(utxo.inscriptionId)) {
            return null;
        }

        if (!interactiveLoad) {
            return (
                <button
                    type="button"
                    onClick={(e) => {
                        // Cards are wrapped in an anchor; the gate must not navigate
                        e.preventDefault();
                        e.stopPropagation();
                        setInteractiveLoad(true);
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        width: "100%",
                        minHeight: "160px",
                        height: "100%",
                        background: "#242435",
                        color: "#a0a0b8",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "0.85em",
                        padding: "12px",
                    }}
                >
                    <span>{utxo.content_type || "Interactive inscription"}</span>
                    <span style={{ textDecoration: "underline" }}>Click to load content</span>
                </button>
            );
        }

        return (
            <iframe
                id={`iframe-${utxo.inscriptionId}`}
                // allow-scripts must never be combined with allow-same-origin
                // here: inscription content is arbitrary attacker-controlled
                // HTML and has to stay on an opaque origin
                sandbox="allow-scripts"
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
        content_type: PropTypes.string,
        inscriptionId: PropTypes.string,
        txId: PropTypes.string,
    }),
};
