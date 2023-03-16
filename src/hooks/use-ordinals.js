/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { useEffect, useRef, useState } from "react";
import { getAddressUtxos } from "@utils/utxos";
import { FETCH_SIZE, TURBO_API } from "@lib/constants";
import LocalStorage, { LocalStorageKeys } from "@services/local-storage";
import { useAsyncFn, useEffectOnce, useDebounce } from "react-use";
import { matchSorter } from "match-sorter";

const axios = require("axios");

const getUtxos = async (nostrAddress) => {
    const utxos = await getAddressUtxos(nostrAddress);
    return utxos.map((utxo) => ({ ...utxo, key: `${utxo.txid}:${utxo.vout}` }));
};

const makeBatches = (arr) =>
    arr.reduce((acc, curr, index) => {
        const batchIndex = Math.floor(index / FETCH_SIZE);
        acc[batchIndex] = [...(acc[batchIndex] || []), curr];
        return acc;
    }, []);

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
    } = await axios.get(`https://turbo.ordinalswallet.com/inscription/${inscriptionId}/outpoint`);

    await LocalStorage.set(key, outpoint);

    return outpoint;
};

const populateInscriptionsMap = async (inscription) => {
    const outpoint = await getOutpointFromCache(inscription.id);
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
    return {
        key: `${txid}:${vout}`,
        value: inscription,
    };
};

const filterAscDate = (arr) => arr.sort((a, b) => a.status.block_time - b.status.block_time);
const filterDescDate = (arr) => arr.sort((a, b) => b.status.block_time - a.status.block_time);
const filterAscValue = (arr) => arr.sort((a, b) => a.value - b.value);
const filterDescValue = (arr) => arr.sort((a, b) => b.value - a.value);

function useOrdinals({ nostrAddress }) {
    const [ordinals, setOrdinals] = useState([]);
    const start = useRef(0);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(false);

    useDebounce(
        () => {
            setDebouncedKeyword(keyword);
        },
        500,
        [keyword]
    );

    const [allOrdinals, fetchOrdinals] = useAsyncFn(async () => {
        start.current = 0;
        const utxos = await getUtxos(nostrAddress);
        const inscriptions = (await axios.get(`${TURBO_API}/wallet/${nostrAddress}/inscriptions`)).data;
        const batches = makeBatches(inscriptions);
        let inscriptionsData = [];
        for (const batch of batches) {
            try {
                const data = await Promise.allSettled(batch.map(populateInscriptionsMap));
                inscriptionsData = [...inscriptionsData, ...data];
            } catch (error) {
                console.error(error); // eslint-disable-line no-console
            }
        }
        const inscriptionsByUtxoKey = inscriptionsData
            .filter((i) => i.status === "fulfilled")
            .map((i) => i.value)
            .reduce((acc, curr) => ({ ...acc, [curr.key]: curr }), {});
        const utxosWithInscriptionData = utxos.map((utxo) => {
            const ins = inscriptionsByUtxoKey[utxo.key];
            return {
                ...utxo,
                inscriptionId: ins?.value?.id,
                ...ins?.value,
            };
        });
        return utxosWithInscriptionData;
    }, [nostrAddress]);

    const isLoading = allOrdinals.loading;

    const applyFilters = (input) => {
        let filtered = !debouncedKeyword.trim()
            ? input
            : matchSorter(input, debouncedKeyword, { keys: ["inscriptionId", "key", "txid"] });
        if (activeSort === "value") {
            filtered = sortAsc ? filterAscValue(filtered) : filterDescValue(filtered);
        } else {
            filtered = sortAsc ? filterAscDate(filtered) : filterDescDate(filtered);
        }
        return filtered;
    };

    const loadMore = () => {
        const input = applyFilters(allOrdinals.value || []);
        const from = start.current;
        const to = Math.min(input.length, from + FETCH_SIZE);
        // TODO: server pagination it is temporal
        const page = input.slice(0, to) || [];
        setOrdinals(page);
        start.current = to;
    };

    useEffect(() => {
        setTotal(allOrdinals.value?.length || 0);
        if (!allOrdinals.value) return;
        start.current = 0;
        loadMore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allOrdinals.value]);

    useEffect(() => {
        if (isLoading) return;
        start.current = 0;
        loadMore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSort, sortAsc, debouncedKeyword]);

    useEffectOnce(() => {
        fetchOrdinals();
    });

    return {
        fetchOrdinals,
        ordinals,
        isLoading,
        loadMore,
        canLoadMore: !isLoading && ordinals.length < total,
        total,
        keyword,
        setKeyword,
        activeSort,
        setActiveSort,
        sortAsc,
        setSortAsc,
    };
}

export default useOrdinals;
