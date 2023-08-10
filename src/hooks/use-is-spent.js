import { useEffect, useState } from "react";
import { useInterval } from "react-use";
import { isSpent as isInscriptionSpent } from "@services/nosft";

const delay = 5000;

function useIsSpent(output) {
  const [currentOutput, setCurrentOutput] = useState(output);
  const [isSpent, setIsSpent] = useState(false);
  const [isPooling, setIsPooling] = useState(true);

  const fetchIsSpent = async () => {
    if (!currentOutput) return;
    console.log("[useIsSpent]", currentOutput);
    const result = await isInscriptionSpent({
      output: currentOutput,
    });
    setIsSpent(result.spent);
    setIsPooling(!result.spent);
  };

  useInterval(
    async () => {
      await fetchIsSpent();
    },
    isPooling && currentOutput ? delay : null,
  );

  useEffect(() => {
    if (!output) return;
    console.log("[useIsSpent] output [changed]", output);
    setCurrentOutput(output);
    setIsPooling(true);
    fetchIsSpent();
  }, [output]);

  return { isSpent, isPooling, setIsPooling };
}

export default useIsSpent;
