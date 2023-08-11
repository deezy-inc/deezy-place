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
    fetchIsSpent();
    console.log("[useIsSpent]", output);
    setCurrentOutput(output);
    setIsPooling(true);
  }, [output]);

  return { isSpent, isPooling, setIsPooling };
}

export default useIsSpent;
