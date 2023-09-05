import useSWR from "swr";
import { useMemo } from "react";
import { useDeezySockets } from "@hooks";
import axios from "axios";
import { NOSFT_BASE_API_URL } from "@services/nosft";

const auctionsUrl = `https://${NOSFT_BASE_API_URL}/auctions`;
const salesUrl = `https://${NOSFT_BASE_API_URL}/inscriptions-for-sale`;

const fetchAuctions = async () => {
  const { data } = await axios.get(auctionsUrl);
  return data.auctions;
};

const fetchSales = async () => {
  const { data } = await axios.get(salesUrl);
  return data;
};

export default function useHome() {
  const { data: auctionsCache, isValidating: isValidatingAuctions } = useSWR(
    auctionsUrl,
    fetchAuctions,
  );
  const { data: salesCache, isValidating: isValidatingSales } = useSWR(
    salesUrl,
    fetchSales,
  );

  const { sales, auctions, loadingAuctions, loadingSales } = useDeezySockets({
    onSale: true,
    onAuction: true,
    limitAuctionResults: true,
    limitSaleResults: true,
  });

  const home = useMemo(() => {
    const hasAuctions = auctions && auctions.length > 0;
    const hasSales = sales && sales.length > 0;
    const hasAuctionsCache = auctionsCache && auctionsCache.length > 0;
    const hasSalesCache = salesCache && salesCache.length > 0;

    if (hasAuctions || hasSales) {
      return {
        fromCache: false,
        auctions: auctions || [],
        sales: sales || [],
        loading: false,
      };
    }

    if (hasAuctionsCache || hasSalesCache) {
      return {
        fromCache: true,
        auctions: auctionsCache || [],
        sales: salesCache || [],
        loading: false,
      };
    }

    return {
      fromCache: false,
      auctions: [],
      sales: [],
      loading:
        loadingAuctions &&
        loadingSales &&
        isValidatingAuctions &&
        isValidatingSales,
    };
  }, [
    loadingAuctions,
    loadingSales,
    isValidatingAuctions,
    isValidatingSales,
    auctions,
    sales,
    auctionsCache,
    salesCache,
  ]);

  return home;
}
