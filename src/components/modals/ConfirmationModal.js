import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371.js";
import { outputValue } from '../../utils';

export default function ConfirmationModal({
  showConfirmSendModal,
  setShowConfirmSendModal,
  currentUtxo,
  sendFeeRate,
  setSentTxid,
  destinationBtcAddress,
  inputAddressInfo,
  inscriptionUtxosByUtxo
}) {
  function toXOnly(key) {
    return key.length === 33 ? key.slice(1, 33) : key;
  }

  async function sendUtxo() {
    const psbt = new bitcoin.Psbt({ network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin })
    // const publicKey = Buffer.from(await window.nostr.getPublicKey(), 'hex')
    const publicKey = '3fde182cc7e6efa69a393b16ef41b10c03928df3b96acf4f0eb03f9fca63a09a'
    const inputParams = {
      hash: currentUtxo.txid,
      index: currentUtxo.vout,
      witnessUtxo: {
        value: currentUtxo.value,
        script: inputAddressInfo.output
      },
      tapInternalKey: toXOnly(publicKey)
    };
    psbt.addInput(inputParams)
    psbt.addOutput({
      address: destinationBtcAddress,
      value: outputValue(currentUtxo, sendFeeRate)
    })
    const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(0, [inputAddressInfo.output], [currentUtxo.value], bitcoin.Transaction.SIGHASH_DEFAULT)
    console.log(sigHash)
    const sig = await window.nostr.signSchnorr(sigHash.toString('hex'))
    psbt.updateInput(0, {
      tapKeySig: serializeTaprootSignature(Buffer.from(sig, 'hex'))
    })
    psbt.finalizeAllInputs()
    const tx = psbt.extractTransaction()
    const hex = tx.toBuffer().toString('hex')
    const fullTx = bitcoin.Transaction.fromHex(hex)
    console.log(hex)
    const res = await axios.post(`https://mempool.space/api/tx`, hex).catch(err => {
      alert(err)
      return null
    })
    if (!res) return false

    setSentTxid(fullTx.getId())
    return true
  }

  return (
    <Modal show={showConfirmSendModal} onHide={() => setShowConfirmSendModal(false)} className="py-5">
      <Modal.Header closeButton className="p-4">
        <Modal.Title>Confirm Send</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body p-4">
        {currentUtxo && <UtxoImage utxo={currentUtxo} style={{ width: "60%" }} inscriptionUtxosByUtxo={inscriptionUtxosByUtxo} />}
        <p>
          <b>Sending:</b> {currentUtxo && `${currentUtxo.txid}:${currentUtxo.vout}`}
        </p>
        <p>
          <b>Fee Rate:</b> {sendFeeRate} sat/vbyte
        </p>
        <p>
          <b>Destination:</b> {destinationBtcAddress}
        </p>
        <p>
          <b>Output Value:</b> {currentUtxo && outputValue(currentUtxo, sendFeeRate)} sats
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => {
          setShowConfirmSendModal(false)
        }}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => {
          setShowConfirmSendModal(false)
          setShowSelectFeeRateModal(true)
        }}>
          Back
        </Button>
        <Button variant="primary" onClick={async () => {
          const success = await sendUtxo().catch(err => {
            alert(err)
            return false
          })
          setShowConfirmSendModal(false)
          if (!success) return
          setShowSentModal(true)
        }}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
