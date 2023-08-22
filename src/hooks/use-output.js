import { getOutput } from "@services/nosft";
import { useAsync } from "react-use";

function useOutput(output) {
  const state = useAsync(async () => {
    if (!output) return undefined;
    const data = await getOutput(output);
    const [txid = "", vout = ""] = output.split(":");
    // console.log("[useOutput]", { ...data, output, txid, vout });
    return { ...data, output, txid, vout: parseInt(vout) };
  }, [output]);

  return state;
}

export default useOutput;
