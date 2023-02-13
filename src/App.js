import React, { useState, useRef, useEffect } from 'react';
import './App.css';

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import { SocialIcon } from 'react-social-icons';
import { TailSpin } from 'react-loading-icons'
import { validate, Network } from 'bitcoin-address-validation';
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371.js";

const buffer_1 = require('buffer');

const axios = require('axios')
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import ECPairFactory from 'ecpair';
const ECPair = ECPairFactory(ecc);

bitcoin.initEccLib(ecc)
const ASSUMED_TX_BYTES = 32 + 10 + 40

const INSCRIPTION_SEARCH_DEPTH = 5
const TESTNET = false
const GITHUB_URL = "https://github.com/dannydeezy/nosft"
const DEFAULT_FEE_RATE = 7

const App = () => {
  const [nostrPublicKey, setNostrPublicKey] = useState(null);
  const [showReceiveAddressModal, setShowReceiveAddressModal] = useState(false);
  const [ownedUtxos, setOwnedUtxos] = useState([]);
  const [utxosReady, setUtxosReady] = useState(false)
  const [inscriptionUtxosByUtxo, setInscriptionUtxosByUtxo] = useState({})
  const [currentUtxo, setCurrentUtxo] = useState(null)
  const [showUtxoModal, setShowUtxoModal] = useState(false)
  const [showBeginSendModal, setShowBeginSendModal] = useState(false)
  const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
  const [destinationBtcAddress, setDestinationBtcAddress] = useState('')
  const [showSelectFeeRateModal, setShowSelectFeeRateModal] = useState(false)
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false)
  const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE)
  const [showSentModal, setShowSentModal] = useState(false)
  const [sentTxid, setSentTxid] = useState(null)

  function toXOnly(key) {
    return key.length === 33 ? key.slice(1, 33) : key;
  }

  function outputValue() {
    return currentUtxo.value - sendFeeRate * ASSUMED_TX_BYTES
  }

  async function sendUtxo() {
    const inputAddressInfo = getAddressInfo()

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
      value: outputValue()
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

  useEffect(() => {
    async function fetchUtxosForAddress() {
      if (!nostrPublicKey) return
      const address = getAddressInfo().address
      const response = await axios.get(`https://mempool.space/api/address/${address}/utxo`)
      const tempInscriptionsByUtxo = {}
      setOwnedUtxos(response.data)
      for (const utxo of response.data) {
        tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo
        if (!utxo.status.confirmed) continue
        let currentUtxo = utxo
        let currentDepth = 0
        console.log(utxo)
        while (true) {
          if (currentDepth > INSCRIPTION_SEARCH_DEPTH) break
          console.log(`looping ${currentDepth}`)
          let inscriptionId = `${currentUtxo.txid}i${currentUtxo.vout}`
          // If there's no inscription here, go back one vin and check again.
          console.log(`Checking inscription id ${inscriptionId}`)
          let res = null
          try {
            res = await axios.get(`https://ordinals.com/inscription/${inscriptionId}`)
          } catch (err) {
            console.log(`Error from ordinals.com`)
          }
          if (!res) {
            currentDepth++
            // get previous vin
            const txResp = await axios.get(`https://mempool.space/api/tx/${utxo.txid}`)
            const tx = txResp.data
            console.log(tx)
            const firstInput = tx.vin[0]
            currentUtxo = { txid: firstInput.txid, vout: firstInput.vout }
            continue
          }
          tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = currentUtxo
          const newInscriptionsByUtxo = {}
          Object.assign(newInscriptionsByUtxo, tempInscriptionsByUtxo)
          setInscriptionUtxosByUtxo(newInscriptionsByUtxo)
          setUtxosReady(true)
          break
        }
      }
      setInscriptionUtxosByUtxo(tempInscriptionsByUtxo)
      setUtxosReady(true)
    }
    fetchUtxosForAddress()
  }, [nostrPublicKey]);

  async function connectWallet() {
    if (window.nostr && window.nostr.enable) {
      await window.nostr.enable()
    } else {
      alert("Oops, it looks like you haven't set up your Nostr key yet. Go to your Alby Account Settings and create or import a Nostr key.")
      return
    }
    const pubkey = await window.nostr.getPublicKey()
    if (pubkey) {
      console.log(pubkey)
      setNostrPublicKey(pubkey)
    }
  }

  function ordinalsUrl(utxo) {
    return `https://ordinals.com/output/${utxo.txid}:${utxo.vout}`
  }

  function ordinalsImageUrl(utxo) {
    return `https://ordinals.com/content/${utxo.txid}i${utxo.vout}`
  }

  function cloudfrontUrl(utxo) {
    return `https://d2v3k2do8kym1f.cloudfront.net/minted-items/${utxo.txid}:${utxo.vout}`
  }

  function shortenStr(str) {
    if (!str) return ""
    return str.substring(0, 8) + "..." + str.substring(str.length - 8, str.length)
  }

  function getAddressInfo() {
    console.log(nostrPublicKey)
    const pubkeyBuffer = Buffer.from(nostrPublicKey, 'hex')
    const addrInfo = bitcoin.payments.p2tr({ pubkey: pubkeyBuffer, network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin })
    console.log(bitcoin.payments.p2tr({ address: 'bc1pavw2c2syd82p5nddqgm5cs8czl3rn6ymek0k6x0zujjsuy5m30fqg7w6q4' }))
    return addrInfo
  }

  function utxoImage(utxo, style) {
    return (<img
      alt=""
      src={utxo.status.confirmed ? ordinalsImageUrl(inscriptionUtxosByUtxo[`${utxo.txid}:${utxo.vout}`]) : cloudfrontUrl(utxo)}
      style={style}
      className="mb-3"
    />)
  }

  function utxoInfo() {
    if (!utxosReady) return (<>
      <br /><br />
      <TailSpin stroke="#000000" speed={.75} />
      <br /><br />
    </>)
    return (<div>
      {
        ownedUtxos.length === 0 ?
          <>
            <div>
              This address doesn't own anything yet..
              <br /><br />
              Consider minting an <a href="https://astralbabes.ai" target="_blank">astral babe</a> (launching soon!)
            </div>
          </>
          :
          <>
            <br />
            <Container className="d-flex flex-wrap">
              {ownedUtxos.map(it => {
                return (
                  <Card className="my-2 mx-2 hover-pointer">
                    <Card.Body className="d-flex flex-column" onClick={() => {
                      setCurrentUtxo(it)
                      setShowUtxoModal(true)
                    }}>
                      {
                        !inscriptionUtxosByUtxo[`${it.txid}:${it.vout}`] ?
                          <>
                            <br /><br />
                            <TailSpin stroke="#000000" speed={.75} />
                            <br /><br />
                          </>
                          :
                          <>
                            <img
                              alt=""
                              src={it.status.confirmed ? ordinalsImageUrl(inscriptionUtxosByUtxo[`${it.txid}:${it.vout}`]) : cloudfrontUrl(it)}
                              style={{ width: "200px" }}
                              className="mb-3"
                            />
                          </>
                      }
                      {shortenStr(it.txid)}:{it.vout}
                    </Card.Body>
                  </Card>
                )
              })}
            </Container>
          </>
      }
    </div>)
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" className="pt-5 pb-5">
        <Container>
          <Navbar.Brand className="flex-row">
            Nosft
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => window.open(GITHUB_URL)}>
              <SocialIcon url={GITHUB_URL} />
            </Nav.Link>
          </Nav>
          <Navbar.Brand>

          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="main-container d-flex flex-column text-center align-items-center justify-content-center">
        {
          nostrPublicKey ?
            <div>
              <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={() => setShowReceiveAddressModal(true)}>Receive Address</Button>
            </div>
            :
            <>
              <p>
                Welcome, Degen
              </p>
              <br />
              <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={() => connectWallet()}>Connect Wallet</Button>
            </>
        }
        <br /><br />
        {nostrPublicKey ?
          <>
            {utxoInfo()}
          </>
          :
          <>
          </>
        }
      </Container>
      <Modal show={showReceiveAddressModal} onHide={() => setShowReceiveAddressModal(false)} className="py-5">
        <Modal.Header closeButton className="p-4">
          <Modal.Title>Receive Address</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-5 py-3 text-center">
          {nostrPublicKey ?
            <div>{getAddressInfo().address}</div>
            :
            <></>
          }
          <br /><br />
          <Button variant="primary" onClick={() => {
            navigator.clipboard.writeText(getAddressInfo().address)
            setShowReceiveAddressModal(false)
          }}>Copy Address</Button>

        </Modal.Body>
      </Modal>
      <Modal show={showUtxoModal} onHide={() => { setShowUtxoModal(false) }} className="py-5">
        <Modal.Header closeButton className="p-4">
          <Modal.Title>{shortenStr(currentUtxo && `${currentUtxo.txid}:${currentUtxo.vout}`)}:{currentUtxo && currentUtxo.vout}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body p-4">
          <div>
            {currentUtxo && utxoImage(currentUtxo, { width: "60%" })}
          </div>
          <p>
            <b>Utxo:</b> <a href={`https://mempool.space/tx/${currentUtxo && currentUtxo.txid}`} target="_blank">{currentUtxo && `${currentUtxo.txid}:${currentUtxo.vout}`}</a>
          </p>
          <p>
            <b>Value:</b> {currentUtxo && currentUtxo.value} sats
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowUtxoModal(false) }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            setShowUtxoModal(false)
            setShowBeginSendModal(true)
          }}>
            Send
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showBeginSendModal} onHide={() => { setShowBeginSendModal(false) }} className="py-5">
        <Modal.Header closeButton className="p-4">
          <Modal.Title>Send {shortenStr(currentUtxo && `${currentUtxo.txid}:${currentUtxo.vout}`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body p-4">
          {currentUtxo && utxoImage(currentUtxo, { width: "60%" })}
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
      <Modal show={showSelectFeeRateModal} onHide={() => setShowSelectFeeRateModal(false)} className="py-5">
        <Modal.Header closeButton className="p-4">
          <Modal.Title>Sending {shortenStr(currentUtxo && `${currentUtxo.txid}:${currentUtxo.vout}`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body p-4">
          {currentUtxo && utxoImage(currentUtxo, { width: "60%" })}
          <p>
            <b>Select a fee rate</b>
          </p>
          <Form.Range min="1" max="100" defaultValue={sendFeeRate} onChange={(evt) => setSendFeeRate(evt.target.value)} />
          <p>
            <b>{sendFeeRate} sat/vbyte</b>
          </p>
          <p>
            <b>Output Value</b>: {currentUtxo && sendFeeRate && outputValue()} sats
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowSelectFeeRateModal(false)
          }}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => {
            setShowSelectFeeRateModal(false)
            setShowBeginSendModal(true)
          }}>
            Back
          </Button>
          <Button variant="primary" onClick={() => {
            setShowSelectFeeRateModal(false);
            setShowConfirmSendModal(true);
          }}>
            Next
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showConfirmSendModal} onHide={() => setShowConfirmSendModal(false)} className="py-5">
        <Modal.Header closeButton className="p-4">
          <Modal.Title>Confirm Send</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body p-4">
          {currentUtxo && utxoImage(currentUtxo, { width: "60%" })}
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
            <b>Output Value:</b> {currentUtxo && outputValue()} sats
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
    </>
  )
}

export default App;
