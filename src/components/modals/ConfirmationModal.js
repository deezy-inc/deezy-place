import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import UtxoImage from '../UtxoImage';
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371.js";
import { outputValue, getAddressInfo } from '../../utils';
import { TESTNET } from '../../constance';
const axios = require('axios')

import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
bitcoin.initEccLib(ecc)

export default function ConfirmationModal({
  showConfirmSendModal,
  setShowConfirmSendModal,
  setShowSelectFeeRateModal,
  setShowSentModal,
  currentUtxo,
  sendFeeRate,
  setSentTxid,
  nostrPublicKey,
  destinationBtcAddress,
  inscriptionUtxosByUtxo
}) {
  function toXOnly(key) {
    return key.length === 33 ? key.slice(1, 33) : key;
  }

  async function sendUtxo() {
    const inputAddressInfo = getAddressInfo(nostrPublicKey)
    const psbt = new bitcoin.Psbt({ network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin })
    const publicKey = Buffer.from(await window.nostr.getPublicKey(), 'hex')

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
      console.error(err)
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
            console.error(err)
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
