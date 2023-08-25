import { useEffect, useState } from "react";
import { useInterval } from "react-use";
import { getAuctionByInscription } from "@services/nosft";

const delay = 5000;

function useAuction(inscriptionId) {
  const [currentInscriptionId, setCurrentInscriptionId] =
    useState(inscriptionId);
  const [auction, setAuction] = useState(null);
  const [isPooling, setIsPooling] = useState(true);

  const fetchAuction = async () => {
    if (!currentInscriptionId) return;
    // console.log("[useAuction]", currentInscriptionId);
    const auctions = await getAuctionByInscription(currentInscriptionId);
    const _auction = auctions?.find(
      (a) => a.status === "RUNNING" || a.status === "PENDING",
    );
    setAuction(_auction);
    setIsPooling(Boolean(_auction));
  };

  useInterval(
    async () => {
      await fetchAuction();
    },
    isPooling && currentInscriptionId ? delay : null,
  );

  useEffect(() => {
    if (!inscriptionId) return;
    setCurrentInscriptionId(inscriptionId);
    setIsPooling(true);
    fetchAuction();
  }, [inscriptionId]);

  const reset = () => {
    setAuction(null);
    setIsPooling(false);
  };

  return { auction, isPooling, setIsPooling, reset };
}

export default useAuction;
