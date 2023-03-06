/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import WalletContext from "@context/wallet-context";
import { INSCRIPTION_SEARCH_DEPTH } from "@lib/constants";

// Use this to fetch data from an API service
const axios = require("axios");

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const OrdinalsArea = ({ className, space, onSale }) => {
    const { nostrAddress } = useContext(WalletContext);

    const [inscriptions, setInscriptions] = useState([]);
    const [utxosReady, setUtxosReady] = useState(false);

    useEffect(() => {
        const fetchByUtxos = async () => {
            setUtxosReady(false);

            const ownedInscriptions = SessionStorage.get(
                SessionsStorageKeys.INSCRIPTIONS_OWNED
            );

            if (ownedInscriptions) {
                setInscriptions(ownedInscriptions);
            }

            const response = await axios.get(
                `https://mempool.space/api/address/${nostrAddress}/utxo`
            );
            const tempInscriptionsByUtxo = {};

            // TODO: Move to promise.all
            // TODO: Order if possible, so that we can get the most recent inscriptions first
            // TODO: Can we remove inscriptions without images?
            for (const utxo of response.data) {
                tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo;
                // if (!utxo.status.confirmed) continue
                let currentUtxo = utxo;
                let currentDepth = 0;

                while (true) {
                    if (currentDepth > INSCRIPTION_SEARCH_DEPTH) break;
                    // console.log(`looping ${currentDepth}`);
                    const inscriptionId = `${currentUtxo.txid}i${currentUtxo.vout}`;
                    // If there's no inscription here, go back one vin and check again.
                    // console.log(`Checking inscription id ${inscriptionId}`);
                    let res = null;
                    try {
                        // use getInscriptionDataById
                        res = await axios.get(
                            `https://ordinals.com/inscription/${inscriptionId}`
                        );
                    } catch (err) {
                        console.error(`Error from ordinals.com`);
                    }
                    if (!res) {
                        // console.log(`No inscription for ${inscriptionId}`);
                        currentDepth += 1;
                        // get previous vin
                        const txResp = await axios.get(
                            `https://mempool.space/api/tx/${currentUtxo.txid}`
                        );
                        const tx = txResp.data;
                        // console.log(tx);
                        const firstInput = tx.vin[0];
                        currentUtxo = {
                            txid: firstInput.txid,
                            vout: firstInput.vout,
                        };

                        continue;
                    }

                    utxo.inscriptionId = inscriptionId;
                    tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] =
                        currentUtxo;
                    break;
                }
            }

            const ownedUtxos = response.data
                .filter((utxo) => {
                    const inscriptionId = `${utxo.txid}:${utxo.vout}`;
                    return tempInscriptionsByUtxo[inscriptionId];
                })
                .map((utxo) => {
                    const inscriptionId = `${utxo.txid}:${utxo.vout}`;
                    const inscriptionUtxo =
                        tempInscriptionsByUtxo[inscriptionId];
                    return {
                        ...utxo,
                        ...inscriptionUtxo,
                    };
                })
                .sort((a, b) => b.status.block_height - a.status.block_height);

            SessionStorage.set(
                SessionsStorageKeys.INSCRIPTIONS_OWNED,
                ownedUtxos
            );

            setInscriptions(ownedUtxos);
            setUtxosReady(true);
        };
        fetchByUtxos();
    }, []);

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
                            isLoading={!utxosReady}
                        />
                        <span>
                            You can safely receive ordinal inscriptions and
                            regular bitcoin to this{" "}
                            <button
                                type="button"
                                className="btn-transparent"
                                onClick={() => {
                                    navigator.clipboard.writeText(nostrAddress);
                                    toast(
                                        "Receive Address copied to clipboard!"
                                    );
                                }}
                            >
                                address
                            </button>
                        </span>
                    </div>
                </div>

                <div className="row g-5">
                    {inscriptions.length > 0 ? (
                        <>
                            {inscriptions.map((inscription) => (
                                <div
                                    key={inscription.txid}
                                    className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                                >
                                    <OrdinalCard
                                        overlay
                                        price={{
                                            amount: inscription.value.toLocaleString(
                                                "en-US"
                                            ),
                                            currency: "Sats",
                                        }}
                                        type="sell"
                                        confirmed={inscription.status.confirmed}
                                        date={inscription.status.block_time}
                                        authors={collectionAuthor}
                                        utxo={inscription}
                                        onSale={onSale}
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
            </div>
        </div>
    );
};

OrdinalsArea.propTypes = {
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
    onSale: PropTypes.func,
};

OrdinalsArea.defaultProps = {
    space: 1,
};

export default OrdinalsArea;
