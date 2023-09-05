import useSWR from "swr";
import axios from "axios";
import { useMemo } from "react";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import useDeezySockets from "./use-sockets";

const marketplaceApiUrl = `https://${NOSFT_BASE_API_URL}/inscriptions-for-sale`;

const fetcher = async (url) => {
  const { data } = await axios.get(url);
  return data;
};

export default function useMarketplace() {
  const {
    data: cache,
    error,
    isValidating,
  } = useSWR(marketplaceApiUrl, fetcher);

  const { sales: orders, loadingSales } = useDeezySockets({
    onSale: true,
    limitSaleResults: false,
  });

  const openOrders = useMemo(() => {
    if (orders && orders.length > 0) {
      console.log("before return orders");
      return orders;
    } else if (cache && cache.length > 0) {
      console.log("before return cache");
      return cache;
    } else {
      return [];
    }
  }, [orders, cache]);

  const loading = loadingSales && isValidating;

  return {
    loading: openOrders && openOrders.length > 0 ? false : loading,
    openOrders: openOrders || [],
    error,
  };
}
