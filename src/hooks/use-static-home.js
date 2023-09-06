import useSWR from "swr";
import axios from "axios";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import { mapAuction, mapInscription } from "@services/nitrous-api";

const auctionsUrl = `https://${NOSFT_BASE_API_URL}/auctions`;
const salesUrl = `https://${NOSFT_BASE_API_URL}/inscriptions-for-sale`;

const fetchAuctions = async () => {
  const { data } = await axios.get(auctionsUrl);
  return data.slice(0, 10).map((auction) => mapAuction(auction.inscription));
};

const isTextInscription = (contentType) => {
  return /(text\/plain|application\/json)/.test(contentType);
};

const fetchSales = async (url) => {
  const { data } = await axios.get(url);
  return data
    .filter((order) => !isTextInscription(order.inscription.contentType))
    .slice(0, 10)
    .map((order) => mapInscription(order.inscription));
};

export default function useStaticHome() {
  const { data: auctions, isLoading: isAuctionsLoading } = useSWR(
    auctionsUrl,
    fetchAuctions,
  );
  const { data: sales, isLoading: isSalesLoading } = useSWR(
    salesUrl,
    fetchSales,
  );

  return {
    auctions: auctions || [],
    sales: sales || [],
    loading:
      isAuctionsLoading ||
      (isSalesLoading && (auctions?.length === 0 || sales?.length === 0)),
  };
}
