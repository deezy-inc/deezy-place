import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function SentModal({ showSentModal, setShowSentModal, sentTxid }) {
  return (
    <Modal show={showSentModal} onHide={() => setShowSentModal(false)} className="py-5">
      <Modal.Header closeButton className="p-4">
        <Modal.Title>Success</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body p-4 text-center">
        <p>
          Your transaction should appear in a few moments <a href={`https://mempool.space/tx/${sentTxid}`} target="_blank" rel="noreferrer">here</a>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => {
          setShowSentModal(false)
        }}>
          Nice
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
