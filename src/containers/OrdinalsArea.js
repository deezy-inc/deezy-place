/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { useContext, useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import LocalStorage, { LocalStorageKeys } from "@services/local-storage";
import SectionTitle from "@components/section-title";
import { toast } from "react-toastify";
import WalletContext from "@context/wallet-context";
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
import { getAddressUtxos } from "@utils/utxos";
import { matchSorter } from "match-sorter";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { Subject } from "rxjs";
import InfiniteOrdinalsList from "@components/infinite-ordinal-list";
import { delay } from "@utils/methods";
// import { scan } from "rxjs/operators";
// Use this to fetch data from an API service
const axios = require("axios");

const axios = require("axios");

const getOwnedInscriptions = async (nostrAddress) => {
    const utxos = await getAddressUtxos(nostrAddress);
    const sortedData = utxos.sort((a, b) => b.status.block_time - a.status.block_time);
    const inscriptions = sortedData.map((utxo) => ({ ...utxo, key: `${utxo.txid}:${utxo.vout}` }));
    // LocalStorage.set(LocalStorageKeys.INSCRIPTIONS_OWNED, inscriptions);
    return inscriptions;
};

const getInscriptionId = async (utxo) => {
    const utxoKey = utxo.key;
    const INSCRIPTIONS_OWNED_KEY = `${LocalStorageKeys.INSCRIPTIONS_OWNED}:utxo:${utxoKey}`;
    const prevInscriptionId = LocalStorage.get(INSCRIPTIONS_OWNED_KEY);
    if (prevInscriptionId) return prevInscriptionId;

    const res = await axios.get(`https://ordinals.com/output/${utxoKey}`);
    const inscriptionId = res.data.match(/<a href=\/inscription\/(.*?)>/)?.[1];
    LocalStorage.set(INSCRIPTIONS_OWNED_KEY, inscriptionId);

    return inscriptionId;
};

const getInscriptionNumberFromOrdinals = async (inscriptionId) => {
    const html = await fetch(`https://ordinals.com/inscription/${inscriptionId}`).then((response) => response.text());
    const inscriptionNumber = html.match(/<h1>Inscription (\d*)<\/h1>/)?.[1];
    if (inscriptionNumber) {
        LocalStorage.set(`${LocalStorageKeys.INSCRIPTION_NUMBER}:${inscriptionId}`, inscriptionNumber);
        return inscriptionNumber;
    }
    return undefined;
};

const getInscriptionData = async (utxo) => {
    const inscriptionId = await getInscriptionId(utxo);
    const inscriptionNumber =
        LocalStorage.get(`${LocalStorageKeys.INSCRIPTION_NUMBER}:${inscriptionId}`) ||
        (await getInscriptionNumberFromOrdinals(inscriptionId));
    const result = {
        ...utxo,
        inscriptionId,
        inscriptionNumber,
    };
    return result;
};

const FETCH_SIZE = 10;

const OrdinalsArea = ({ className, space }) => {
    const { nostrAddress } = useContext(WalletContext);
    const [utxosReady, setUtxosReady] = useState(false);
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
    const [refreshHack, setRefreshHack] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(false);

    const addOpenOrder$ = useRef(new Subject());
    const addSubscriptionRef = useRef(null);
    const loadedInscriptionsCount = useRef(0);
    const start = useRef(0);
    const [ownedInscriptions, setOwnedInscriptions] = useState([]);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
        window.location.reload(); // TODO: Fix, we should avoid duplicate data on refresh
    };

    const addNewOpenOrder = (order) => {
        addOpenOrder$.current.next(order);
    };

    useEffect(() => {
        const fetchByUtxos = async () => {
            const inscriptions = await getOwnedInscriptions(nostrAddress);
            setOwnedInscriptions(inscriptions);
        };
        addSubscriptionRef.current = addOpenOrder$.current.subscribe((order) => {
            setOwnedUtxos((prev) => [...prev, order]);
            setFilteredOwnedUtxos((prev) => [...prev, order]);
        });
        fetchByUtxos();
    }, [nostrAddress]);

    const loadInscriptions = useCallback(() => {
        const fetchInscriptionData = async () => {
            setUtxosReady(false);
            const from = start.current;
            const to = Math.min(ownedInscriptions.length, from + FETCH_SIZE);
            try {
                for (let i = from; i < to; i++) {
                    const inscription = await getInscriptionData(ownedInscriptions[i]);
                    addNewOpenOrder(inscription);
                    await delay(100);
                }
            } catch (error) {
                console.error(error);
            } finally {
                // We could improve the error handling
                start.current = to;
                loadedInscriptionsCount.current += to - from;
                setUtxosReady(true);
            }
        };
        fetchInscriptionData().catch(console.error);
    }, [ownedInscriptions]);

    useEffect(() => {
        if (ownedInscriptions.length > 0) {
            loadInscriptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ownedInscriptions]);

    const isLoading = !utxosReady;

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: "Your collection" }} isLoading={isLoading} />
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
                    {ownedUtxos.length > 0 && (
                        <>
                            <InfiniteOrdinalsList
                                isLoading={isLoading}
                                items={filteredOwnedUtxos}
                                canLoadMore={!isLoading && filteredOwnedUtxos.length < ownedInscriptions.length}
                                next={loadInscriptions}
                                onSale={handleRefreshHack}
                            />
                            {filteredOwnedUtxos.length === 0 && (
                                <div className="col-12">
                                    <div className="text-center">
                                        <h3>No results found</h3>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!isLoading && ownedUtxos.length === 0 && (
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
