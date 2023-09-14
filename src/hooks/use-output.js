import { getOutput } from "@services/nosft";
import useSWR from "swr";

const fetcher = async (output) => {
  if (!output) return undefined;
  const data = await getOutput(output);
  const [txid = "", vout = ""] = output.split(":");
  return { ...data, output, txid, vout: parseInt(vout) };
};

function useOutput({ output }) {
  const { data, error, isLoading } = useSWR(output, fetcher);
  return { value: data, error, isLoading };
}

export default useOutput;
