import { useDeezySockets } from "@hooks";

import axios from "axios";
import { useMemo } from "react";
import { useAsync } from "react-use";

const getHome = async () => {
  const { data } = await axios.get(
    "https://w8rejxzn8k.us-east-1.awsapprunner.com/api/v1/auctions",
  );
  return {
    auctions: data.auctions,
  };
};

export default function useLiveAuctions() {
  const { auctions, loadingAuctions } = useDeezySockets({
    onAuction: true,
    limitSaleResults: false,
  });

  const { value: cache, loading: loadingCache } = useAsync(async () => {
    return getAuctions();
  }, []);

  const auctionsResult = useMemo(() => {
    if (cache && cache.auctions && loadingAuctions) {
      return {
        auctions: cache.auctions || [],
        fromCache: true,
        loading: false,
      };
    }
    return {
      fromCache: false,
      auctions: auctions || [],
      loading: loadingCache || loadingAuctions,
    };
  }, [loadingCache, loadingAuctions, auctions, cache]);

  return auctionsResult;
}
