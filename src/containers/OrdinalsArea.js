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
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
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

    // const [inscriptions, setInscriptions] = useState([]);
    const [utxosReady, setUtxosReady] = useState(false);
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [inscriptionUtxosByUtxo, setInscriptionUtxosByUtxo] = useState({});

    useEffect(() => {
        console.log("OrdinalsArea useEffect");
        const fetchByUtxos = async () => {
            setUtxosReady(false);

            const ownedInscriptions = SessionStorage.get(SessionsStorageKeys.INSCRIPTIONS_OWNED);

            if (ownedInscriptions) {
                // setInscriptions(ownedInscriptions);
            }

            const response = await axios.get(`https://mempool.space/api/address/${nostrAddress}/utxo`);
            const tempInscriptionsByUtxo = {};
            setOwnedUtxos(response.data);
            for (const utxo of response.data) {
                tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo;
                // if (!utxo.status.confirmed) continue
                let currentUtxo = utxo;
                console.log("utxo", utxo);

                console.log(`Checking utxo ${currentUtxo.txid}:${currentUtxo.vout}`);
                try {
                    const res = await axios.get(`https://ordinals.com/output/${currentUtxo.txid}:${currentUtxo.vout}`);
                    const inscriptionId = res.data.match(/<a href=\/inscription\/(.*?)>/)?.[1];
                    const [txid, vout] = inscriptionId.split("i");
                    utxo.inscriptionId = inscriptionId;
                    currentUtxo = { txid, vout };
                } catch (err) {
                    console.log(`Error from ordinals.com`);
                }
                tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = currentUtxo;
                const newInscriptionsByUtxo = {};
                Object.assign(newInscriptionsByUtxo, tempInscriptionsByUtxo);
                setInscriptionUtxosByUtxo(newInscriptionsByUtxo);
                setUtxosReady(true);
            }

            SessionStorage.set(SessionsStorageKeys.INSCRIPTIONS_OWNED, ownedUtxos);
            setInscriptionUtxosByUtxo(tempInscriptionsByUtxo);

            // setInscriptions(ownedUtxos);
            setUtxosReady(true);
        };
        fetchByUtxos();
    }, []);

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: "Your collection" }} isLoading={!utxosReady} />
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
                                onClick={() => {
                                    navigator.clipboard.writeText(nostrAddress);
                                    toast("Receive Address copied to clipboard!");
                                }}
                            >
                                {" "}
                                {shortenStr(nostrAddress)}
                            </button>
                        </span>
                    </div>
                </div>

                <div className="row g-5">
                    {ownedUtxos.length > 0 && (
                        <>
                            {ownedUtxos.map((inscription) => (
                                <div key={inscription.txid} className="col-5 col-lg-4 col-md-6 col-sm-6 col-12">
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
                                        onSale={onSale}
                                    />
                                </div>
                            ))}
                        </>
                    )}

                    {utxosReady && ownedUtxos.length === 0 && (
                        <div>
                            This address does not own anything yet..
                            <br />
                            <br />
                            Consider minting an{" "}
                            <a href="https://astralbabes.ai" target="_blank" rel="noreferrer">
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
