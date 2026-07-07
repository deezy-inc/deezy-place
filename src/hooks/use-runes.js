import { useState, useEffect, useMemo } from 'react';
import { getOutputData } from '@services/nosft';

// Classifies uninscribed wallet utxos from one output fetch each: which
// runes they hold and which non-common sat rarities ("rare sats") they carry.
//
// `loading` is true from the very first render until the CURRENT utxo set is
// fully classified (readiness is keyed to the utxo set, not a state flag an
// effect flips later). Callers must treat loading as "classification
// unknown" and show nothing rather than defaulting utxos to cardinal.
const useRunes = (utxos) => {
  const [resolved, setResolved] = useState({ key: null, data: {} });

  const utxosKey = useMemo(
    () => (utxos || []).map((u) => `${u.txid}:${u.vout}`).join(','),
    [utxos]
  );
  const loading = utxosKey !== '' && resolved.key !== utxosKey;

  useEffect(() => {
    if (!utxos || utxos.length === 0) {
      return undefined;
    }
    let cancelled = false;

    const fetchOutputData = async () => {
      const newOutputData = {};

      // Only fetch for uninscribed UTXOs (those without inscriptionId);
      // inscribed ones are already classified and never shown as cardinal
      const uninscribedUtxos = utxos.filter(utxo => !utxo.inscriptionId);

      // Fetch in small parallel batches so large wallets resolve quickly
      const batchSize = 10;
      for (let i = 0; i < uninscribedUtxos.length; i += batchSize) {
        const batch = uninscribedUtxos.slice(i, i + batchSize);
        await Promise.all(batch.map(async (utxo) => {
          const outpoint = `${utxo.txid}:${utxo.vout}`;
          try {
            const data = await getOutputData(outpoint);
            if (data && (data.runes?.length > 0 || data.rareSats?.length > 0)) {
              newOutputData[outpoint] = {
                runes: data.runes || [],
                rareSats: data.rareSats || [],
              };
            }
          } catch (error) {
            console.error(`Error fetching output data for ${outpoint}:`, error);
          }
        }));
        if (cancelled) return;
      }

      if (!cancelled) {
        setResolved({ key: utxosKey, data: newOutputData });
      }
    };

    fetchOutputData();
    return () => {
      cancelled = true;
    };
    // utxosKey covers the utxo identities; utxos itself may be a fresh array
    // with the same content, which must not refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utxosKey]);

  const getRunesForUtxo = (utxo) => {
    if (!utxo) return [];
    const outpoint = `${utxo.txid}:${utxo.vout}`;
    return resolved.data[outpoint]?.runes || [];
  };

  const getRareSatsForUtxo = (utxo) => {
    if (!utxo) return [];
    const outpoint = `${utxo.txid}:${utxo.vout}`;
    return resolved.data[outpoint]?.rareSats || [];
  };

  return {
    outputData: resolved.data,
    loading,
    getRunesForUtxo,
    getRareSatsForUtxo,
  };
};

export default useRunes;
