import React from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import Form from 'react-bootstrap/Form'
import UtxoImage from '../UtxoImage'
import { shortenStr } from "../../utils"

export default function BeginSendModal({
  showBeginSendModal,
  setShowBeginSendModal,
  currentUtxo,
  setIsBtcInputAddressValid,
  setDestinationBtcAddress,
  setShowSelectFeeRateModal,
  isBtcInputAddressValid,
  inscriptionUtxosByUtxo,
  TESTNET,
  setShowUtxoModal
}) {
  return (
    <Modal show={showBeginSendModal} onHide={() => { setShowBeginSendModal(false) }} className="py-5">
      <Modal.Header closeButton className="p-4">
        <Modal.Title>Send {shortenStr(currentUtxo && `${currentUtxo.txid}:${currentUtxo.vout}`)}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body p-4">
        {currentUtxo && <UtxoImage utxo={currentUtxo} style={{ width: "60%" }} inscriptionUtxosByUtxo={inscriptionUtxosByUtxo} />}
        <p>Where would you like to send this to?</p>
        <InputGroup className="mb-3">
          <Form.Control onChange={(evt) => {
            const newaddr = evt.target.value
            if (newaddr === '') {
              setIsBtcInputAddressValid(true)
              return
            }
            if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
              setIsBtcInputAddressValid(false)
              return
            }
            setDestinationBtcAddress(newaddr)
            setShowBeginSendModal(false)
            setShowSelectFeeRateModal(true)
          }}
            placeholder="Paste BTC address here"
            aria-label="Paste BTC address heres"
            aria-describedby="basic-addon2"
            isInvalid={!isBtcInputAddressValid}
            autoFocus
          />
          <Form.Control.Feedback type="invalid">
            <br />That is not a valid {TESTNET ? 'testnet' : 'mainnet'} BTC address
          </Form.Control.Feedback>
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => {
          setShowBeginSendModal(false)
        }}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => {
          setShowUtxoModal(true)
          setShowBeginSendModal(false)
        }}>
          Back
        </Button>
        <Button variant="primary" onClick={() => { setShowBeginSendModal(true) }}>
          Send
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
