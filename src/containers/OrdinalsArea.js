/* eslint-disable react/forbid-prop-types */

import PropTypes from "prop-types";
import clsx from "clsx";
import { TailSpin } from "react-loading-icons";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import { ordinalsImageUrl, cloudfrontUrl } from "@utils/crypto";

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const OrdinalsArea = ({
    className,
    space,
    utxosReady,
    ownedUtxos,
    inscriptionUtxosByUtxo,
    address,
}) => {
    const getSrc = (utxo) => {
        console.log(utxo);
        if (utxo.status.confirmed) {
            return ordinalsImageUrl(
                inscriptionUtxosByUtxo[`${utxo.txid}:${utxo.vout}`]
            );
        }
        return cloudfrontUrl(utxo);
    };

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
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle
                            className="mb--0"
                            {...{ title: "Your collection" }}
                        />
                        <span>
                            You can safely receive ordinal inscriptions and
                            regular bitcoin to this{" "}
                            <a
                                className="copy-address"
                                onClick={() => {
                                    navigator.clipboard.writeText(address);
                                    toast(
                                        "Receive Address copied to clipboard!"
                                    );
                                }}
                            >
                                address
                            </a>
                        </span>
                    </div>
                </div>

                {!utxosReady && <TailSpin stroke="#fec823" speed={0.75} />}

                {utxosReady && (
                    <div className="row g-5">
                        {ownedUtxos.length > 0 ? (
                            <>
                                {ownedUtxos
                                    .filter((utxo) =>
                                        Boolean(
                                            inscriptionUtxosByUtxo[
                                                `${utxo.txid}:${utxo.vout}`
                                            ]
                                        )
                                    )
                                    .map((utxo) => (
                                        <div
                                            key={utxo.txid}
                                            className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                                        >
                                            <OrdinalCard
                                                overlay
                                                slug={utxo.txid}
                                                minted={utxo.status.confirmed}
                                                price={{
                                                    amount: utxo.value.toLocaleString(
                                                        "en-US"
                                                    ),
                                                    currency: "Sats",
                                                }}
                                                image={{
                                                    src: getSrc(utxo),
                                                }}
                                                authors={collectionAuthor}
                                                utxo={utxo}
                                            />
                                        </div>
                                    ))}
                            </>
                        ) : (
                            <div>
                                This address does not own anything yet..
                                <br />
                                <br />
                                Consider minting an{" "}
                                <a
                                    href="https://astralbabes.ai"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    astral babe
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

OrdinalsArea.propTypes = {
    className: PropTypes.string,
    address: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
    utxosReady: PropTypes.bool,
    ownedUtxos: PropTypes.arrayOf(PropTypes.object),
    inscriptionUtxosByUtxo: PropTypes.object,
};

OrdinalsArea.defaultProps = {
    space: 1,
};

export default OrdinalsArea;
