import React, { useState, useRef, useEffect } from 'react';
import './App.css';

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Modal from 'react-bootstrap/Modal';
import { SocialIcon } from 'react-social-icons';

const axios = require('axios')
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
bitcoin.initEccLib(ecc)

const INSCRIPTION_SEARCH_DEPTH = 5

const GITHUB_URL = "https://github.com/dannydeezy/nosft"
const App = () => {
  const [nostrPublicKey, setNostrPublicKey] = useState(null);
  const [showReceiveAddressModal, setShowReceiveAddressModal] = useState(false);
  const [ownedUtxos, setOwnedUtxos] = useState([]);
  const [utxosReady, setUtxosReady] = useState(false)
  const [inscriptionUtxosByUtxo, setInscriptionUtxosByUtxo] = useState({})

  useEffect(() => {
    async function fetchUtxosForAddress() {
      if (!nostrPublicKey) return
      const address = getAddress()
      const response = await axios.get(`https://mempool.space/api/address/${address}/utxo`)
      setOwnedUtxos(response.data)
      const tempInscriptionsByUtxo = {}
      for (const utxo of response.data) {
        tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo
        if (!utxo.status.confirmed) continue
        let currentUtxo = utxo
        let currentDepth = 0
        console.log(utxo)
        while(true) {
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
            currentUtxo = { txid: firstInput.txid, vout: firstInput.vout}
            continue
          }
          tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = currentUtxo
          break
        }
      }
      // console.log(response.data)
      setInscriptionUtxosByUtxo(tempInscriptionsByUtxo)
      setUtxosReady(true)
    }
    fetchUtxosForAddress()
  }, [nostrPublicKey]);

  async function connectWallet() {
    if (window.nostr && window.nostr.enable) {
      await window.nostr.enable()
    }
    const pubkey = await window.nostr.getPublicKey()
    if (pubkey) {
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
    return str.substring(0, 8) + "..." + str.substring(str.length - 8, str.length)
  }

  function getAddress() {
    console.log(nostrPublicKey)
    const pubkeyBuffer = Buffer.from(nostrPublicKey, 'hex')
    return bitcoin.payments.p2tr({ pubkey: pubkeyBuffer, network: bitcoin.networks.bitcoin }).address;
  }

  function utxoInfo() {
    if (!utxosReady) return (<></>)
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
            <div>
              This address owns {ownedUtxos.length} utxo{ownedUtxos.length > 1 ? 's' : ''}:
            </div>
            <br />
            <Container className="d-flex flex-wrap">
              {utxos()}
            </Container>
          </>
      }
    </div>)
  }

  function utxos() {
    return ownedUtxos.map(it => {
      return (
        <Card className="my-2 mx-2 hover-pointer">
          <Card.Body className="d-flex flex-column" onClick={() => window.open(ordinalsUrl(it))}>
            <img
              alt=""
              src={
                it.status.confirmed ? ordinalsImageUrl(inscriptionUtxosByUtxo[`${it.txid}:${it.vout}`]) : cloudfrontUrl(it)
              }
              style={{ width: "200px" }}
              className="mb-3"
            />
            {shortenStr(it.txid)}:{it.vout}
          </Card.Body>
        </Card>
      )
    })
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
              <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={() => setShowReceiveAddressModal(true)}>Show Receive Address</Button>
            </div>
            :
            <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={() => connectWallet()}>Connect Nostr (Alby, etc)</Button>
        }
        <br /><br />
        {nostrPublicKey ?
          <>
            {utxoInfo()}
          </>
          :
          <>
            <div>
              Nosft is an open-source bitcoin wallet connected to your nostr key.
              <br /><br />
              It is designed to hold ordinal inscriptions (aka NFTs).
              <br /><br />
              Sending is not implemented yet, but will be soon!
            </div>
          </>
        }
      </Container>
      <Modal show={showReceiveAddressModal} onHide={() => setShowReceiveAddressModal(false)} className="py-5">
        <Modal.Header closeButton className="p-4">
          <Modal.Title>Receive Address</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-5 py-3">
          {nostrPublicKey ?
            <div>{getAddress()}</div>
            :
            <></>
          }
        </Modal.Body>
      </Modal>
    </>
  )
}

export default App;
