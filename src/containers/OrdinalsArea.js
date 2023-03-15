/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import WalletContext from "@context/wallet-context";
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
import { getAddressUtxos } from "@utils/utxos";
import axios from "axios";
import { matchSorter } from "match-sorter";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { TURBO_API } from "@lib/constants";

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const getSortedUtxos = async (nostrAddress) => {
    const utxos = await getAddressUtxos(nostrAddress);
    const sortedData = utxos.sort((a, b) => b.status.block_time - a.status.block_time);
    return sortedData.map((utxo) => ({ ...utxo, key: `${utxo.txid}:${utxo.vout}` }));
};

const OrdinalsArea = ({ className, space }) => {
    const { nostrAddress } = useContext(WalletContext);
    const [utxosReady, setUtxosReady] = useState(false);
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
    const [refreshHack, setRefreshHack] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(false);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    // here matching to the utxo

    useEffect(() => {
        const loadUtxos = async () => {
            setUtxosReady(false);

            const utxos = await getSortedUtxos(nostrAddress);
            const inscriptions = await axios.get(`${TURBO_API}/wallet/${nostrAddress}/inscriptions`);

            const inscriptionsByUtxoKey = {};
            const batchPromises = [];
            const populateInscriptionsMap = async (ins) => {
                const {
                    data: {
                        inscription: { outpoint },
                    },
                } = await axios.get(`https://turbo.ordinalswallet.com/inscription/${ins.id}/outpoint`);

                const rawVout = outpoint.slice(-8);
                const txid = outpoint
                    .substring(0, outpoint.length - 8)
                    .match(/[a-fA-F0-9]{2}/g)
                    .reverse()
                    .join("");

                const buf = new ArrayBuffer(4);
                const view = new DataView(buf);
                rawVout.match(/../g).forEach((b, i) => {
                    view.setUint8(i, parseInt(b, 16));
                });

                const vout = view.getInt32(0, 1);
                inscriptionsByUtxoKey[`${txid}:${vout}`] = ins;
            };

            for (const ins of inscriptions.data) {
                batchPromises.push(populateInscriptionsMap(ins));
                if (batchPromises.length === 15) {
                    await Promise.allSettled(batchPromises);
                    batchPromises.length = 0;
                }
            }
            await Promise.allSettled(batchPromises);

            const utxosWithInscriptionData = utxos.map((utxo) => {
                const ins = inscriptionsByUtxoKey[utxo.key];
                return {
                    ...utxo,
                    inscriptionId: ins?.id,
                    ...ins,
                };
            });

            setOwnedUtxos(utxosWithInscriptionData);
            setFilteredOwnedUtxos(utxosWithInscriptionData);
            setUtxosReady(true);
        };
        loadUtxos();
    }, [refreshHack, nostrAddress]);

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: "Your collection" }} isLoading={!utxosReady} />
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
                    <div className="col-lg-4 col-md-4 col-sm-4 col-8">
                        <input
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                const filteredUtxos = matchSorter(ownedUtxos, e.target.value, {
                                    keys: [
                                        "inscriptionId",
                                        "key",
                                        "txid",
                                        "vout",
                                        "value",
                                        "status.block_time",
                                        "status.block_height",
                                        "status.confirmed",
                                    ],
                                });
                                setFilteredOwnedUtxos(filteredUtxos);
                            }}
                        />
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-1 col-2">
                        <button
                            type="button"
                            className={clsx(
                                "sort-button d-flex flex-row justify-content-center",
                                activeSort === "date" && "active"
                            )}
                            onClick={() => {
                                if (activeSort === "date") {
                                    setFilteredOwnedUtxos(
                                        filteredOwnedUtxos.sort((a, b) => {
                                            const res = !sortAsc
                                                ? a.status.block_time - b.status.block_time
                                                : b.status.block_time - a.status.block_time;
                                            return res;
                                        })
                                    );
                                    setSortAsc(!sortAsc);
                                    return;
                                }
                                setFilteredOwnedUtxos(
                                    filteredOwnedUtxos.sort((a, b) => {
                                        const res = sortAsc
                                            ? a.status.block_time - b.status.block_time
                                            : b.status.block_time - a.status.block_time;
                                        return res;
                                    })
                                );
                                setActiveSort("date");
                            }}
                        >
                            <div>Date</div>
                            {activeSort === "date" && (
                                <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
                            )}
                        </button>
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-1 col-2">
                        <button
                            type="button"
                            className={clsx(
                                "sort-button d-flex flex-row justify-content-center",
                                activeSort === "value" && "active"
                            )}
                            onClick={() => {
                                if (activeSort === "value") {
                                    setFilteredOwnedUtxos(
                                        filteredOwnedUtxos.sort((a, b) => {
                                            const res = !sortAsc ? a.value - b.value : b.value - a.value;
                                            return res;
                                        })
                                    );
                                    setSortAsc(!sortAsc);
                                    return;
                                }
                                setFilteredOwnedUtxos(
                                    filteredOwnedUtxos.sort((a, b) => {
                                        const res = sortAsc ? a.value - b.value : b.value - a.value;
                                        return res;
                                    })
                                );
                                setActiveSort("value");
                            }}
                        >
                            <div>Value</div>
                            {activeSort === "value" && (
                                <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
                            )}
                        </button>
                    </div>
                </div>

                <div className="row g-5">
                    {utxosReady && ownedUtxos.length > 0 && (
                        <>
                            {filteredOwnedUtxos.map(
                                (inscription) =>
                                    inscription.inscriptionId && (
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
                                                onSale={handleRefreshHack}
                                            />
                                        </div>
                                    )
                            )}
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
