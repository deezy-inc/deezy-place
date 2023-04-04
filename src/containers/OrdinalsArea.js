/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { useContext, useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import WalletContext from "@context/wallet-context";
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
import { getAddressUtxos } from "@utils/utxos";
import axios from "axios";
import { matchSorter } from "match-sorter";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { TURBO_API } from "@lib/constants";
import LocalStorage, { LocalStorageKeys } from "@services/local-storage";

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

const filterAscDate = (arr) => arr.sort((a, b) => a.status.block_time - b.status.block_time);
const filterDescDate = (arr) => arr.sort((a, b) => b.status.block_time - a.status.block_time);
const filterAscValue = (arr) => arr.sort((a, b) => a.value - b.value);
const filterDescValue = (arr) => arr.sort((a, b) => b.value - a.value);
const filterAscNum = (arr) => arr.sort((a, b) => a.num - b.num);
const filterDescNum = (arr) => arr.sort((a, b) => b.num - a.num);

const applyFilters = ({ utxos, activeSort, sortAsc }) => {
    let filtered = utxos;
    if (activeSort === "value") {
        filtered = sortAsc ? filterAscValue(filtered) : filterDescValue(filtered);
    } else if (activeSort === "num") {
        filtered = sortAsc ? filterAscNum(filtered) : filterDescNum(filtered);
    } else {
        filtered = sortAsc ? filterAscDate(filtered) : filterDescDate(filtered);
    }
    return filtered;
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

    const getOutpointFromCache = async (inscriptionId) => {
        const key = `${LocalStorageKeys.INSCRIPTIONS_OUTPOINT}:${inscriptionId}`;
        const cachedOutpoint = await LocalStorage.get(key);
        if (cachedOutpoint) {
            return cachedOutpoint;
        }

        const {
            data: {
                inscription: { outpoint },
            },
        } = await axios.get(`${TURBO_API}/inscription/${inscriptionId}/outpoint`);

        await LocalStorage.set(key, outpoint);

        return outpoint;
    };

    const onFilterByValue = () => {
        if (activeSort === "value") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("value");
    };
    const onFilterByNum = () => {
        if (activeSort === "num") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("num");
    };
    const onFilterByDate = () => {
        if (activeSort === "date") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("date");
    };

    const onCopyAddress = () => {
        navigator.clipboard.writeText(nostrAddress);
        toast("Receive Address copied to clipboard!");
    };

    useMemo(() => {
        const filteredUtxos = applyFilters({
            utxos: filteredOwnedUtxos,
            activeSort,
            sortAsc,
        });
        setFilteredOwnedUtxos(filteredUtxos);
    }, [filteredOwnedUtxos, activeSort, sortAsc]);

    useEffect(() => {
        const loadUtxos = async () => {
            setUtxosReady(false);

            const utxos = await getSortedUtxos(nostrAddress);
            const inscriptionsResponse = await axios.get(`${TURBO_API}/wallet/${nostrAddress}/inscriptions`);
            const inscriptions = inscriptionsResponse.data;

            const inscriptionsByUtxoKey = new Map();
            const batchPromises = [];
            const populateInscriptionsMap = async (ins) => {
                const outpoint = await getOutpointFromCache(ins.id);

                const rawVout = outpoint.slice(-8);
                const txid = outpoint
                    .substring(0, outpoint.length - 8)
                    .match(/[a-fA-F0-9]{2}/g)
                    .reverse()
                    .join("");

                const buf = new ArrayBuffer(4);
                const view = new DataView(buf);
                for (const b of rawVout.match(/../g)) {
                    view.setUint8(i, parseInt(b, 16));
                }

                const vout = view.getInt32(0, 1);
                inscriptionsByUtxoKey.set(`${txid}:${vout}`, ins);
            };

            for (const ins of inscriptions) {
                batchPromises.push(populateInscriptionsMap(ins));
                if (batchPromises.length === 15) {
                    await Promise.all(batchPromises);
                    batchPromises.length = 0;
                }
            }
            await Promise.all(batchPromises);

            const utxosWithInscriptionData = utxos.map((utxo) => {
                const { id, ...rest } = inscriptionsByUtxoKey.get(utxo.key) || {};
                return {
                    ...utxo,
                    inscriptionId: id,
                    ...rest,
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
                            <button type="button" className="btn-transparent" onClick={onCopyAddress}>
                                {" "}
                                {shortenStr(nostrAddress)}
                            </button>
                        </span>
                    </div>
                    <div className="col-lg-3 col-md-4 col-sm-4 col-6">
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
                                        "num",
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
                            onClick={onFilterByDate}
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
                            onClick={onFilterByValue}
                        >
                            <div>Value</div>
                            {activeSort === "value" && (
                                <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
                            )}
                        </button>
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-1 col-2">
                        <button
                            type="button"
                            className={clsx(
                                "sort-button d-flex flex-row justify-content-center",
                                activeSort === "num" && "active"
                            )}
                            onClick={onFilterByNum}
                        >
                            <div>#</div>
                            {activeSort === "num" && <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>}
                        </button>
                    </div>
                </div>

                <div className="row g-5">
                    {utxosReady && ownedUtxos.length > 0 && (
                        <>
                            {filteredOwnedUtxos.map((inscription) => (
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
