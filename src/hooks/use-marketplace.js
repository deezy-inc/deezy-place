import axios from "axios";
import { useAsync } from "react-use";

const base = "https://w8rejxzn8k.us-east-1.awsapprunner.com/api/v1/marketplace";

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
