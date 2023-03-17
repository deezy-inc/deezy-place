/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { useEffect, useState } from "react";
import { FETCH_SIZE } from "@lib/constants";
import { useEffectOnce, useDebounce } from "react-use";

const axios = require("axios");

function useOrdinals({ nostrAddress, loadAll }) {
    const [ordinals, setOrdinals] = useState([]);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useDebounce(
        () => {
            setDebouncedKeyword(keyword);
        },
        500,
        [keyword]
    );

    const loadOrdinals = async (pOffset) => {
        setIsFetching(true);
        const currentOffset = pOffset || offset;
        const {
            data: { inscriptionsWithUtxo, count, size },
        } = await axios.get(`/api/inscriptions/${nostrAddress}?offset=${currentOffset}&limit=${FETCH_SIZE}`);
        const loaded = size + currentOffset;
        setTotal(count);
        setOffset((prev) => size + prev);
        setOrdinals((prev) => [...prev, ...inscriptionsWithUtxo]);
        setIsFetching(false);
        return { count, loaded };
    };

    const loadMore = async () => {
        if (isFetching) return;
        await loadOrdinals();
    };

    useEffect(() => {
        if (isFetching) return;
        // WIP
        console.log("[apply filter]");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSort, sortAsc, debouncedKeyword]);

    const refetchOrdinals = async () => {
        setOrdinals([]);
        loadMore(0);
    };

    // We can auto load all the ordinals
    const autoLoad = async () => {
        let localOffset = 0;
        do {
            const { count, loaded } = await loadOrdinals(localOffset);
            if (loaded >= count) break;
            localOffset = loaded;
        } while (true);
    };

    useEffectOnce(() => {
        if (loadAll) {
            autoLoad();
        } else {
            loadMore(0);
        }
    });

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
    };
}

export default useOrdinals;
