import { NOSFT_BASE_API_URL, getOutput } from "@services/nosft";
import useSWR from "swr";
import axios from "axios";

const fetcher = async (output) => {
  let outputData = {};
  if (!output) return undefined;
  try {
    outputData = await getOutput(output);
  } catch (error) {
    console.log("[error]", error.message);
    return null;
  }
  let nostr;
  try {
    const {
      data: { item },
    } = await axios.get(`${NOSFT_BASE_API_URL}/uninscribed/${output}`);
    nostr = item;
  } catch (error) {
    nostr = null;
  }
  const [txid = "", vout = ""] = output.split(":");
  return { ...outputData, output, txid, vout: parseInt(vout), nostr };
};

function useOutput({ output }) {
  const { data, error, isLoading } = useSWR(output, fetcher);
  return { value: data, error, isLoading };
}

export default useOutput;
