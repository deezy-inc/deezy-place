import { getOutputData } from "@services/nosft";
import { useAsync } from "react-use";

function useOutput(output) {
  const state = useAsync(async () => {
    if (!output) return undefined;
    // One turbo fetch provides the raw output plus normalized runes/rareSats
    const data = await getOutputData(output);
    const [txid = "", vout = ""] = output.split(":");
    console.log("[useOutput]", { ...data, output, txid, vout });

    return {
      ...data,
      output,
      txid,
      vout: parseInt(vout),
      runes: data?.runes || [],
      rareSats: data?.rareSats || [],
    };
  }, [output]);

  return state;
}

export default useOutput;
