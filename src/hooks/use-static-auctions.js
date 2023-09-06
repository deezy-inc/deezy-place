import useSWR from "swr";
import { NOSFT_BASE_API_URL } from "@services/nosft";
import axios from "axios";
import { parseInscriptonData } from "@services/nitrous-api";

const auctionsUrl = `https://${NOSFT_BASE_API_URL}/auctions`;

const fetchAuctions = async () => {
  const { data } = await axios.get(auctionsUrl);
  return data.map((data) => parseInscriptonData(data.auctions));
};

export default function useStaticAuctions() {
  const { data: auctions, isLoading } = useSWR(auctionsUrl, fetchAuctions);

  return {
    loading: isLoading && auctions?.length === 0,
    auctions: [],
    // @nosfter please continue
    // auctions: auctions && auctions?.length > 0 ? auctions : [],
  };
}
