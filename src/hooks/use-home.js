import { useDeezySockets } from "@hooks";
import useSWR from "swr";
import { NOSFT_BASE_API_URL } from "@services/nosft";

import axios from "axios";
import { useMemo } from "react";

const homeApiUrl = `https://${NOSFT_BASE_API_URL}/home`;

const fetcher = async () => {
  const { data } = await axios.get(homeApiUrl);
  return {
    auctions: data.auctions,
    sales: data.marketplace,
  };
};

export default function useHome({ realtime = true }) {
  const {
    sales: liveSales,
    auctions: liveAuctions,
    loadingAuctions: isLoadingLiveAuctions,
    loadingSales: isLoadingLiveSales,
  } = useDeezySockets({
    onSale: true,
    onAuction: true,
    limitAuctionResults: true,
    limitSaleResults: true,
  });

  const { data: staticHome, isLoading } = useSWR(homeApiUrl, fetcher);

  const home = useMemo(() => {
    // Prioritize the sockets result if it's ready
    if (realtime && !isLoadingLiveAuctions && !isLoadingLiveSales) {
      return {
        sourse: "sockets",
        auctions: liveAuctions || [],
        sales: liveSales || [],
        loading: isLoadingLiveAuctions || isLoadingLiveSales,
      };
    }

    // If sockets result is not ready, use staticHome
    if (staticHome && staticHome.auctions && staticHome.sales) {
      return {
        auctions: staticHome.auctions || [],
        sales: staticHome.sales || [],
        sourse: "api",
        loading: isLoading,
      };
    }

    // Default return if none of the above conditions are met
    return {
      auctions: [],
      sales: [],
      sourse: "",
      loading: true,
    };
  }, [
    isLoadingLiveAuctions,
    isLoadingLiveSales,
    liveAuctions,
    liveSales,
    staticHome,
    isLoading,
  ]);

  return home;
}
