import { useState, useEffect } from 'react';
import { getRuneData } from '@services/nosft';

const useRunes = (utxos) => {
  const [runeData, setRuneData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!utxos || utxos.length === 0) {
      setRuneData({});
      return;
    }

    const fetchRuneData = async () => {
      setLoading(true);
      const newRuneData = {};

      // Only fetch for uninscribed UTXOs (those without inscriptionId)
      const uninscribedUtxos = utxos.filter(utxo => !utxo.inscriptionId);

      for (const utxo of uninscribedUtxos) {
        const outpoint = `${utxo.txid}:${utxo.vout}`;
        try {
          const data = await getRuneData(outpoint);
          if (data && data.runes && data.runes.length > 0) {
            newRuneData[outpoint] = data.runes;
          }
        } catch (error) {
          console.error(`Error fetching rune data for ${outpoint}:`, error);
        }
      }

      setRuneData(newRuneData);
      setLoading(false);
    };

    fetchRuneData();
  }, [utxos]);

  const getRunesForUtxo = (utxo) => {
    if (!utxo) return [];
    const outpoint = `${utxo.txid}:${utxo.vout}`;
    return runeData[outpoint] || [];
  };

  return {
    runeData,
    loading,
    getRunesForUtxo
  };
};

export default useRunes; 