import useSWR from "swr";
import axios from "axios";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import { mapInscription } from "@services/nitrous-api";

const marketplaceApiUrl = `https://${NOSFT_BASE_API_URL}/inscriptions-for-sale`;

const fetcher = async (url) => {
  const { data } = await axios.get(url);
  return data.map((order) => mapInscription(order.inscription));
};

export default function useStaticMarketplace() {
  const { data: openOrders, isLoading } = useSWR(marketplaceApiUrl, fetcher);

  return {
    loading: isLoading && openOrders?.length === 0,
    openOrders: openOrders && openOrders.length > 0 ? openOrders : [],
  };
}
