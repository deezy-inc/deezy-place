/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { useEffect, useMemo, useState } from "react";
import { FETCH_SIZE } from "@lib/constants";
import { useDebounce } from "react-use";
import { matchSorter } from "match-sorter";

import axios from "axios";

const filterAscDate = (arr) => arr.sort((a, b) => a.status.block_time - b.status.block_time);
const filterDescDate = (arr) => arr.sort((a, b) => b.status.block_time - a.status.block_time);
const filterAscValue = (arr) => arr.sort((a, b) => a.value - b.value);
const filterDescValue = (arr) => arr.sort((a, b) => b.value - a.value);

const applyFilters = ({ ordinals, activeSort, sortAsc, keyword }) => {
    let filtered = !keyword.trim()
        ? ordinals
        : matchSorter(ordinals, keyword, { keys: ["inscriptionId", "key", "txid", (i) => `#${i.num}`] });
    if (activeSort === "value") {
        filtered = sortAsc ? filterAscValue(filtered) : filterDescValue(filtered);
    } else {
        filtered = sortAsc ? filterAscDate(filtered) : filterDescDate(filtered);
    }
    return filtered;
};

function useOrdinals({ nostrAddress }) {
    const [ordinals, setOrdinals] = useState([]);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    useDebounce(
        () => {
            setDebouncedKeyword(keyword?.trim());
        },
        500,
        [keyword]
    );

    const loadOrdinals = async (pOffset) => {
        setIsFetching(true);
        const currentOffset = pOffset || offset;
        const {
            data: { inscriptions, count, size },
        } = await axios.get(`/api/inscriptions/${nostrAddress}?offset=${currentOffset}&limit=${FETCH_SIZE}`);
        const loaded = size + currentOffset;
        setTotal(count);
        setOffset((prev) => size + prev);
        setOrdinals((prev) => [...prev, ...inscriptions]);
        setIsFetching(false);
        return { count, loaded };
    };

    const loadMore = async () => {
        if (isFetching) return;
        await loadOrdinals();
    };

    const filteredOrdinals = useMemo(() => {
        if (isFetching) return ordinals;
        return applyFilters({ ordinals, activeSort, sortAsc, keyword: debouncedKeyword });
    }, [ordinals, activeSort, sortAsc, debouncedKeyword, isFetching]);

    const refetchOrdinals = async () => {
        setOrdinals([]);
        loadMore(0);
    };

    useEffect(() => {
        refetchOrdinals();
    }, [nostrAddress]);

    return {
        refetchOrdinals,
        ordinals,
        isLoading: isFetching,
        loadMore,
        canLoadMore: !isFetching && ordinals.length < total,
        total,
        keyword,
        setKeyword,
        activeSort,
        setActiveSort,
        sortAsc,
        setSortAsc,
        filteredOrdinals,
        debouncedKeyword,
    };
}

export default useOrdinals;
