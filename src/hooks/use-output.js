import { getOutput, getRuneData } from "@services/nosft";
import { useAsync } from "react-use";

function useOutput(output) {
  const state = useAsync(async () => {
    if (!output) return undefined;
    const data = await getOutput(output);
    const [txid = "", vout = ""] = output.split(":");
    console.log("[useOutput]", { ...data, output, txid, vout });
    
    // Fetch rune data for this output
    let runeData = null;
    try {
      runeData = await getRuneData(output);
    } catch (error) {
      console.error("Error fetching rune data:", error);
    }
    
    return { 
      ...data, 
      output, 
      txid, 
      vout: parseInt(vout),
      runes: runeData?.runes || []
    };
  }, [output]);

  return state;
}

export default useOutput;
