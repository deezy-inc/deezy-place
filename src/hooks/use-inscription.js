import { useEffect, useState } from "react";
import { getInscription, getNostrInscription } from "@services/nosft";
import { number } from "prop-types";

function useInscription(slug) {
    const [inscription, setInscription] = useState();
    const [nostrData, setNostrData] = useState();
    const [collection, setCollection] = useState();

    const fetchNostrInscription = async (utxo) => {
        const data = await getNostrInscription(utxo);
        setNostrData(data);
    };

    const fetchInscription = async () => {
        const { inscription: _inscription, collection: _collection } = await getInscription(slug);
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

    useEffect(() => {
        if (!slug) return;
        fetchInscription();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    return { inscription, collection, nostrData };
}

export default useInscription;
