import { useEffect, useState } from "react";
import { useInterval } from "react-use";
import { getNostrBid } from "@services/nosft";

const delay = 5000;

function useBid({ inscriptionId, output }) {
  const [bids, setBids] = useState([]);
  const [isPooling, setIsPooling] = useState(false);
  const [currentInscriptionId, setCurrentInscriptionId] =
    useState(inscriptionId);
  const [currentOutput, setCurrentOutput] = useState(output);

  const fetchBid = async () => {
    if (!inscriptionId) return;
    console.log("[useBid]", {
      inscriptionId: currentInscriptionId,
      output: currentOutput,
    });
    const result = await getNostrBid({
      inscriptionId: currentInscriptionId,
      output: currentOutput,
    });
    setBids(result);
  };

  useInterval(
    async () => {
      await fetchBid();
    },
    isPooling && currentInscriptionId && currentOutput ? delay : null,
  );

  useEffect(() => {
    if (!inscriptionId || !output) return;
    setCurrentInscriptionId(inscriptionId);
    setCurrentOutput(output);
    setIsPooling(true);
    fetchBid();
  }, [inscriptionId, output]);

  const reset = () => {
    setBids([]);
    setIsPooling(false);
  };

  return { bids, isPooling, setIsPooling, reset };
}

export default useBid;
