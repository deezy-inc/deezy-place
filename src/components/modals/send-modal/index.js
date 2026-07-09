/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getInscriptions, getOutputData } from "@services/nosft";
import { SendBulkModal } from "@components/modals/send-bulk-modal";
import { useWallet } from "@context/wallet-context";

// Thin wrapper over the bulk send flow so there is a single unified send
// path: the inscription and output pages' Send buttons open the bulk modal
// with just this utxo selected. Owned utxos are fetched so the flow can pull
// in cardinal funding when the fee can't come from the utxo's own padding.
const SendModal = ({ show, handleModal, utxo, onSend }) => {
  const { nostrOrdinalsAddress } = useWallet();
  const [ownedUtxos, setOwnedUtxos] = useState(null);
  const [utxoOutputData, setUtxoOutputData] = useState(null);

  useEffect(() => {
    if (!nostrOrdinalsAddress || ownedUtxos) return;
    const fetchOwnedUtxos = async () => {
      try {
        const utxos = await getInscriptions(nostrOrdinalsAddress);
        setOwnedUtxos(utxos);
      } catch (error) {
        console.error(error);
        setOwnedUtxos([]);
      }
    };
    fetchOwnedUtxos();
  }, [nostrOrdinalsAddress, ownedUtxos]);

  // The bulk flow labels runes and rare-sat utxos distinctly, so classify
  // this utxo before handing it over
  useEffect(() => {
    if (!utxo || utxoOutputData !== null) return;
    const fetchOutputData = async () => {
      try {
        const data = await getOutputData(`${utxo.txid}:${utxo.vout}`);
        setUtxoOutputData({
          runes: data?.runes || [],
          rareSats: data?.rareSats || [],
        });
      } catch (error) {
        console.error(error);
        setUtxoOutputData({ runes: [], rareSats: [] });
      }
    };
    fetchOutputData();
  }, [utxo, utxoOutputData]);

  if (!utxo) return null;

  // Prefer the wallet-loaded copy of this utxo: it carries the annotations
  // the spend path uses (inscriptionId, maxSatOffset for fee padding)
  const ownedCopy = (ownedUtxos || []).find(
    (u) => u.txid === utxo.txid && u.vout === utxo.vout,
  );
  const selectedUtxo = {
    ...(ownedCopy || utxo),
    runes: utxoOutputData?.runes || [],
    rareSats: utxoOutputData?.rareSats || [],
  };

  return (
    <SendBulkModal
      show={show}
      handleModal={handleModal}
      onSend={() => {
        if (onSend) onSend();
      }}
      ownedUtxos={ownedUtxos || []}
      selectedUtxos={[selectedUtxo]}
    />
  );
};

SendModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  onSend: PropTypes.func,
};

export default SendModal;
