import { useEffect, useState } from "react";
import { useInterval } from "react-use";
import { getNostrBid } from "@services/nosft";

const delay = 5000;

function useBid({ inscriptionId, output }) {
  const [bids, setBids] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPooling, setIsPooling] = useState(false);
  const [currentInscriptionId, setCurrentInscriptionId] =
    useState(inscriptionId);
  const [currentOutput, setCurrentOutput] = useState(output);

  const fetchBid = async () => {
    if (!inscriptionId) return;
    // console.log("[useBid]", {
    //   inscriptionId: currentInscriptionId,
    //   output: currentOutput,
    // });
    const result = await getNostrBid({
      inscriptionId: currentInscriptionId,
      output: currentOutput,
    });
    setBids(result);
    setIsLoading(false);
  };

  useInterval(
    async () => {
      await fetchBid();
    },
    isPooling && currentInscriptionId && currentOutput ? delay : null,
  );

  useEffect(() => {
    if (!inscriptionId || !output) {
      setBids(null);
    }
    setCurrentInscriptionId(inscriptionId);
    setCurrentOutput(output);
    setIsPooling(true);
    setIsLoading(true);
    fetchBid();
  }, [inscriptionId, output]);

  const reset = () => {
    setBids(null);
    setIsPooling(false);
  };

  return { bids, isPooling, setIsPooling, reset, isLoading };
}

export default useBid;
