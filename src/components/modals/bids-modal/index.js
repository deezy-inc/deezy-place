/* eslint-disable */
import { useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import { getPsbt, signAcceptBid } from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { useWallet } from "@context/wallet-context";
import { toast } from "react-toastify";
import BidList from "@components/bids/bid-list";

bitcoin.initEccLib(ecc);

const BidsModal = ({
  show,
  handleModal,
  onAcceptBid,
  bids,
  shouldShowTakeBid,
}) => {
  const { nostrOrdinalsAddress } = useWallet();

  const [isOnAcceptBid, setIsOnAcceptBid] = useState(false);

  const acceptBid = async (bid) => {
    setIsOnAcceptBid(true);

    try {
      const buyerSignedPsbt = getPsbt(bid.nostr.content);
      const txId = await signAcceptBid({
        psbt: buyerSignedPsbt,
        ordinalAddress: nostrOrdinalsAddress,
      });

      toast.success(`Transaction sent: ${txId}, copied to clipboard`);
      navigator.clipboard.writeText(txId);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }

    setIsOnAcceptBid(false);
    onAcceptBid();
    handleModal();
  };

  return (
    <Modal
      className="bidListComponent rn-popup-modal placebid-modal-wrapper"
      show={show}
      onHide={handleModal}
      centered
    >
      {show && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={handleModal}
        >
          <i className="feather-x" />
        </button>
      )}
      <Modal.Header>
        <h3 className="modal-title">Bids</h3>
      </Modal.Header>
      <Modal.Body>
        <BidList
          bids={bids}
          onTakeBid={acceptBid}
          isOnAcceptBid={isOnAcceptBid}
          shouldShowTakeBid={shouldShowTakeBid}
        />
      </Modal.Body>
    </Modal>
  );
};

BidsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  bids: PropTypes.array,
  onAcceptBid: PropTypes.func,
};
export default BidsModal;
