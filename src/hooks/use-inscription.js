import { useEffect, useState } from "react";
import { getInscription, getLatestSellNostrInscription } from "@services/nosft";
import { useInterval } from "react-use";

const delay = 5000;

function useInscription(inscriptionId) {
  const [inscription, setInscription] = useState();
  const [currentInscriptionId, setCurrentInscriptionId] =
    useState(inscriptionId);
  const [nostrData, setNostrData] = useState();
  const [collection, setCollection] = useState();
  const [isPooling, setIsPooling] = useState(true);

  const fetchNostrInscription = async (utxo) => {
    if (!utxo?.inscriptionId) return;
    const data = await getLatestSellNostrInscription(utxo);
    // console.log("[fetchNostrInscription]", utxo?.inscriptionId, data);
    setNostrData(data);
  };

  const fetchInscription = async () => {
    if (!currentInscriptionId) return;
    // console.log("[useInscription]", currentInscriptionId);
    const { inscription: _inscription, collection: _collection } =
      await getInscription(currentInscriptionId);
    const output = _inscription
      ? _inscription.output || `${_inscription.txid}:${_inscription.vout}`
      : null;
    const utxo = { ..._inscription, output };
    setInscription(utxo);
    setCollection(_collection);
    await fetchNostrInscription(utxo);
  };

  useInterval(
    async () => {
      await fetchInscription();
    },
    isPooling && currentInscriptionId ? delay : null,
  );

  useEffect(() => {
    if (!inscriptionId) return;
    setCurrentInscriptionId(inscriptionId);
    setIsPooling(true);
    fetchInscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inscriptionId]);

  return { inscription, collection, nostrData, isPooling, setIsPooling };
}

export default useInscription;
