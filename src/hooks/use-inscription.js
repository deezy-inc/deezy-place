import { useEffect, useState } from "react";
import {  getLatestSellNostrInscription } from "@services/nosft";
import { useInterval } from "react-use";
import { getInscription} from "../services/nitrous-api"

const delay = 5000;

function useInscription(inscriptionId) {
  const [inscription, setInscription] = useState();
  const [currentInscriptionId, setCurrentInscriptionId] =
    useState(inscriptionId);
  const [nostrData, setNostrData] = useState();
  const [bids, setBids] = useState(null);
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collection, setCollection] = useState();
  const [isPooling, setIsPooling] = useState(true);

  const fetchInscription = async (id) => {
    const _currentInscriptionId = id || currentInscriptionId;
    if (!_currentInscriptionId) return;
    console.log("[useInscription]", _currentInscriptionId);
    const result = await getInscription(_currentInscriptionId);
    const { inscription: _inscription, collection: _collection, nostr: _nostr, bids: _bids, auction: _auction  } = result;
    console.log('[useInscription]', id, JSON.stringify({ _auction }))
    
    const output = _inscription
      ? _inscription.output || `${_inscription.txid}:${_inscription.  vout}`
      : null;
    const utxo = { ..._inscription, output };

    setIsLoading(false);
    setInscription(utxo);
    setCollection(_collection);
    setNostrData(_nostr);
    setBids(_bids);
    setAuction(_auction)
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
    fetchInscription(inscriptionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inscriptionId]);

  return { inscription, collection, nostrData, isPooling, setIsPooling, bids, isLoading, auction };
}

export default useInscription;
