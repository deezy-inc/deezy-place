import axios from "axios";
import { useAsync } from "react-use";
import { NOSFT_BASE_API_URL } from "@services/nosft";

const base = `https://${NOSFT_BASE_API_URL}/api/v1/marketplace`;

const getOffers = async () => {
  const { data } = await axios.get(base);
  return data.marketplace;
};

export default function useMarketplace() {
  const {
    value: openOrders,
    error,
    loading,
  } = useAsync(async () => {
    return getOffers();
  }, []);
  return { loading, openOrders: openOrders || [], error };
}
