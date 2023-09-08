import useSWR from "swr";
import { useDeezySockets } from "@hooks";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import axios from "axios";
import { useMemo } from "react";

const auctionsApiUrl = `${NOSFT_BASE_API_URL}/auctions`;

const fetcher = async () => {
  const { data } = await axios.get(auctionsApiUrl);
  return {
    auctions: data.auctions.map((auction) => ({ ...auction, auction: true })),
  };
};

export default function useAuctions({ realtime = true }) {
  const { data: staticAuctions, isValidating: isLoadingStaticAuctions } =
    useSWR(auctionsApiUrl, fetcher);

  const { auctions: liveAuctions, loadingAuctions } = useDeezySockets({
    onAuction: true,
    limitSaleResults: false,
  });

  const auctionsResult = useMemo(() => {
    const hasLiveAuctions = liveAuctions && liveAuctions.length > 0;
    const hasStaticAuctions = staticAuctions && staticAuctions.auctions;

    // Prioritize real-time data from WebSocket if it's ready
    if (realtime && !loadingAuctions && hasLiveAuctions) {
      return {
        source: "sockets",
        auctions: liveAuctions,
        loading: false,
      };
    }

    // Fall back to staticAuctions data if WebSocket data isn't ready
    if (hasStaticAuctions) {
      return {
        source: "api",
        auctions: staticAuctions.auctions,
        loading: isLoadingStaticAuctions,
      };
    }

    // If neither is available, indicate loading state
    return {
      source: "",
      auctions: [],
      loading: isLoadingStaticAuctions || loadingAuctions,
    };
  }, [isLoadingStaticAuctions, loadingAuctions, liveAuctions, staticAuctions]);

  return auctionsResult;
}
