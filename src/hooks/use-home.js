import { useDeezySockets } from "@hooks";
import { NOSFT_BASE_API_URL } from "@services/nosft";

import axios from "axios";
import { useMemo } from "react";
import { useAsync } from "react-use";

const getHome = async () => {
  const { data } = await axios.get(`https://${NOSFT_BASE_API_URL}/api/v1/home`);
  return {
    auctions: data.auctions,
    sales: data.marketplace,
  };
};

export default function useHome() {
  const { sales, auctions, loadingAuctions, loadingSales } = useDeezySockets({
    onSale: true,
    onAuction: true,
    limitAuctionResults: true,
    limitSaleResults: true,
  });

  const { value: cache, loading: loadingCache } = useAsync(async () => {
    return getHome();
  }, []);

  const home = useMemo(() => {
    if (
      cache &&
      cache.auctions &&
      cache.sales &&
      (loadingAuctions || loadingSales)
    ) {
      return {
        auctions: cache.auctions || [],
        sales: cache.sales || [],
        fromCache: true,
        loading: false,
      };
    }
    return {
      fromCache: false,
      auctions: auctions || [],
      sales: sales || [],
      loading: loadingCache || loadingAuctions || loadingSales,
    };
  }, [loadingCache, loadingSales, auctions, sales, cache]);

  return home;
}
