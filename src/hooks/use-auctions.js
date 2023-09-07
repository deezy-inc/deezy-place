import useSWR from "swr";
import { useDeezySockets } from "@hooks";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import axios from "axios";
import { useMemo } from "react";

const auctionsApiUrl = `https://${NOSFT_BASE_API_URL}/auctions`;

const fetcher = async () => {
  const { data } = await axios.get(auctionsApiUrl);
  return {
    auctions: data.auctions,
  };
};

export default function useLiveAuctions() {
  const { data: cache, isValidating } = useSWR(auctionsApiUrl, fetcher);

  const { auctions, loadingAuctions } = useDeezySockets({
    onAuction: true,
    limitSaleResults: false,
  });

  const auctionsResult = useMemo(() => {
    const hasAuctions = auctions && auctions.length > 0;
    const hasCache = cache && cache.auctions;

    // Prioritize real-time data from WebSocket
    if (hasAuctions) {
      return {
        fromCache: false,
        auctions: auctions,
        loading: false,
      };
    }

    // Fall back to cached data if WebSocket data isn't available
    if (hasCache) {
      return {
        fromCache: true,
        auctions: cache.auctions,
        loading: false,
      };
    }

    // If neither is available, indicate loading state
    return {
      fromCache: false,
      auctions: [],
      loading: isValidating && loadingAuctions && isValidating,
    };
  }, [isValidating, loadingAuctions, auctions, cache]);

  return auctionsResult;
}
