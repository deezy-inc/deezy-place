import { useEffect, useState } from "react";
import { useInterval } from "react-use";
import { getAuctionByInscription } from "@services/nosft";

const delay = 3000;

function useAuction(inscriptionId) {
    const [currentInscriptionId, setCurrentInscriptionId] = useState(inscriptionId);
    const [auction, setAuction] = useState();
    const [isPooling, setIsPooling] = useState(true);

    const fetchAuction = async () => {
        if (!currentInscriptionId) return;
        const auctions = await getAuctionByInscription(currentInscriptionId);
        const _auction = auctions?.find((a) => a.status === "RUNNING" || a.status === "PENDING");
        setAuction(_auction);
        setIsPooling(Boolean(_auction));
    };

    useInterval(
        async () => {
            await fetchAuction();
        },
        isPooling && currentInscriptionId ? delay : null
    );

    useEffect(() => {
        if (!inscriptionId) return;
        console.log("[useAuction]", inscriptionId);
        setCurrentInscriptionId(inscriptionId);
        setIsPooling(true);
    }, [inscriptionId]);

    return { auction, isPooling, setIsPooling };
}

export default useAuction;
