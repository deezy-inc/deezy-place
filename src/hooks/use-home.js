import useSWR from "swr";
import { useMemo } from "react";
import { useDeezySockets } from "@hooks";
import axios from "axios";
import { NOSFT_BASE_API_URL } from "@services/nosft";

const homeApiUrl = `https://${NOSFT_BASE_API_URL}/api/v1/home`;

const fetcher = async () => {
  const { data } = await axios.get(homeApiUrl);
  return {
    auctions: data.auctions,
    sales: data.marketplace,
  };
};

export default function useHome() {
  const { data: cache, isValidating } = useSWR(homeApiUrl, fetcher);

  const { sales, auctions, loadingAuctions, loadingSales } = useDeezySockets({
    onSale: true,
    onAuction: true,
    limitAuctionResults: true,
    limitSaleResults: true,
  });

  const home = useMemo(() => {
    const hasAuctions = auctions && auctions.length > 0;
    const hasSales = sales && sales.length > 0;
    const hasCache = cache && cache.auctions && cache.sales;

    // Prioritize real-time data from WebSocket
    if (hasAuctions || hasSales) {
      return {
        fromCache: false,
        auctions: auctions || [],
        sales: sales || [],
        loading: false,
      };
    }

    // Fall back to cached data if WebSocket data isn't available
    if (hasCache) {
      return {
        fromCache: true,
        auctions: cache.auctions || [],
        sales: cache.sales || [],
        loading: false,
      };
    }

    // If neither is available, indicate loading state
    return {
      fromCache: false,
      auctions: [],
      sales: [],
      loading: loadingAuctions && loadingSales && isValidating,
    };
  }, [loadingAuctions, loadingSales, auctions, sales, cache]);

  return home;
}
