import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { getAddressInfo } from '../../utils';

export default function ReceiveAddressModal({ showReceiveAddressModal, setShowReceiveAddressModal, nostrPublicKey }) {
  return (
    <Modal show={showReceiveAddressModal} onHide={() => setShowReceiveAddressModal(false)} className="py-5">
      <Modal.Header closeButton className="p-4">
        <Modal.Title>Receive Address</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-5 py-3 text-center">
        {nostrPublicKey && <div>{getAddressInfo(nostrPublicKey).address}</div>}
        <br />
          <p className="very-small-text">
            (you can safely receive ordinal inscriptions and regular bitcoin to this address)
          </p>
        <br />
        <Button variant="primary" onClick={() => {
          navigator.clipboard.writeText(getAddressInfo(nostrPublicKey).address)
          setShowReceiveAddressModal(false)
        }}>Copy Address</Button>
      </Modal.Body>
    </Modal>
  )
}
