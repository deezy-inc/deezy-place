import useSWR from "swr";
import axios from "axios";
import { useMemo } from "react";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import useDeezySockets from "./use-sockets";

const marketplaceApiUrl = `https://${NOSFT_BASE_API_URL}/marketplace`;

const fetcher = async (url) => {
  const { data } = await axios.get(url);
  return data.marketplace;
};

export default function useMarketplace({ realtime = true }) {
  const { data: staticSaleOffers, isLoading: isLoadingStaticSaleOffers } =
    useSWR(marketplaceApiUrl, fetcher);

  const { sales: liveSaleOffers, loadingSales: isLoadingLiveSaleOffers } =
    useDeezySockets({
      onSale: true,
      limitSaleResults: false,
    });

  const { openOrders, sourse } = useMemo(() => {
    if (
      realtime &&
      liveSaleOffers &&
      liveSaleOffers.length > 0 &&
      !isLoadingLiveSaleOffers
    ) {
      return {
        openOrders: liveSaleOffers,
        sourse: "sockets",
      };
    } else if (staticSaleOffers && staticSaleOffers.length > 0) {
      return {
        openOrders: staticSaleOffers,
        sourse: "api",
      };
    } else {
      return {
        openOrders: [],
        sourse: "",
      };
    }
  }, [liveSaleOffers, staticSaleOffers]);

  const isLoading = isLoadingStaticSaleOffers && isLoadingLiveSaleOffers;

  return {
    loading: openOrders && openOrders.length > 0 ? false : isLoading,
    openOrders: openOrders || [],
    sourse,
  };
}
