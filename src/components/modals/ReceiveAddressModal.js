import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function ReceiveAddressModal({ showReceiveAddressModal, setShowReceiveAddressModal, getAddressInfo, nostrPublicKey }) {
  return (
    <Modal show={showReceiveAddressModal} onHide={() => setShowReceiveAddressModal(false)} className="py-5">
      <Modal.Header closeButton className="p-4">
        <Modal.Title>Receive Address</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-5 py-3 text-center">
        {nostrPublicKey && <div>{getAddressInfo().address}</div>}
        <br /><br />
        <Button variant="primary" onClick={() => {
          navigator.clipboard.writeText(getAddressInfo().address)
          setShowReceiveAddressModal(false)
        }}>Copy Address</Button>
      </Modal.Body>
    </Modal>
  )
}
