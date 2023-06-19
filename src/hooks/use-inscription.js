import { useEffect, useState } from "react";
import { getInscription, getLatestNostrInscription } from "@services/nosft";
import { useInterval } from "react-use";

const delay = 3000;

function useInscription(inscriptionId) {
    const [inscription, setInscription] = useState();
    const [currentInscriptionId, setCurrentInscriptionId] = useState(inscriptionId);
    const [nostrData, setNostrData] = useState();
    const [collection, setCollection] = useState();
    const [isPooling, setIsPooling] = useState(true);

    const fetchNostrInscription = async (utxo) => {
        const data = await getLatestNostrInscription(utxo);
        setNostrData(data);
    };

    const fetchInscription = async () => {
        const { inscription: _inscription, collection: _collection } = await getInscription(inscriptionId);
        const output = _inscription ? _inscription.output || `${_inscription.txid}:${_inscription.vout}` : null;
        if (output) {
            const utxo = { ..._inscription, output };
            setInscription(utxo);
            setCollection(_collection);
            await fetchNostrInscription(utxo);
            return;
        }
        setInscription(_inscription);
        setCollection(_collection);
    };

    useInterval(
        async () => {
            await fetchInscription();
        },
        isPooling && currentInscriptionId ? delay : null
    );

    useEffect(() => {
        if (!inscriptionId) return;
        console.log("[useInscription]", inscriptionId);
        setCurrentInscriptionId(inscriptionId);
        setIsPooling(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inscriptionId]);

    return { inscription, collection, nostrData, isPooling, setIsPooling };
}

export default useInscription;
