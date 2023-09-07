import useSWR from "swr";
import axios from "axios";
import { useMemo } from "react";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import useDeezySockets from "./use-sockets";

const marketplaceApiUrl = `https://${NOSFT_BASE_API_URL}/marketplace`;

const fetcher = async (url) => {
  const { data } = await axios.get(url);
  return data;
};

export default function useMarketplace({ realtime = true }) {
  const { data: statisSaleOffers, isLoading: isLoadingStaticSaleOffers } =
    useSWR(marketplaceApiUrl, fetcher);

  const { sales: liveSaleOffers, loadingSales: isLoadingLiveSaleOffers } =
    useDeezySockets({
      onSale: true,
      limitSaleResults: false,
    });

  const { openOrders, sourse } = useMemo(() => {
    if (
      liveSaleOffers &&
      liveSaleOffers.length > 0 &&
      !isLoadingLiveSaleOffers &&
      realtime
    ) {
      return {
        openOrders: liveSaleOffers,
        sourse: "sockets",
      };
    } else if (statisSaleOffers && statisSaleOffers.length > 0) {
      return {
        openOrders: statisSaleOffers,
        sourse: "api",
      };
    } else {
      return {
        openOrders: [],
        sourse: "",
      };
    }
  }, [liveSaleOffers, statisSaleOffers]);

  const isLoading = isLoadingStaticSaleOffers && isLoadingLiveSaleOffers;

  return {
    loading: openOrders && openOrders.length > 0 ? false : isLoading,
    openOrders: openOrders || [],
    sourse,
  };
}
