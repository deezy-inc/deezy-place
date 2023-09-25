import { getOutput } from "@services/nosft";
import { getBestSat, rarityOptions } from "@utils/utxo";
import { useMemo } from "react";
import useSWR from "swr";

const fetcher = async ({ output, utxo }) => {
  if (!output) return undefined;
  if (utxo.sat_ranges) {
    return getBestSat(utxo.sat_ranges);
  }
  const data = await getOutput(output);
  const rarity = getBestSat(data.sat_ranges);
  return rarity;
};

function useRatity({ output, utxo }) {
  const { data, error, isLoading } = useSWR({ output, utxo }, fetcher);
  const rarityUtxo = useMemo(
    () => ({
      value: data && rarityOptions.some((r) => r === data) ? data : "common",
      error,
      isLoading,
    }),
    [data, error, isLoading],
  );
  return rarityUtxo;
}

export default useRatity;
