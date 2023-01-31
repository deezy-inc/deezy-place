import React, { useState, useRef, useEffect } from 'react';
import './App.css';

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Modal from 'react-bootstrap/Modal';
import DeezyLogo from './assets/images/Deezy 2.svg';
import { SocialIcon } from 'react-social-icons';
var ReactRotatingText = require('react-rotating-text');
import { FadeIn } from 'react-slide-fade-in';
import NavLink from 'react-bootstrap/esm/NavLink';
const axios = require('axios')

import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import { BIP32Factory } from 'bip32'
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc)
bitcoin.initEccLib(ecc)

import { nip19, generatePrivateKey, getPublicKey } from 'nostr-tools'

const DISCORD_URL = "https://discord.gg/ASfVZ8Cc6f"
const TWITTER_URL = "https://twitter.com/astral_babes"
const NODE_ID = "024bfaf0cabe7f874fd33ebf7c6f4e5385971fc504ef3f492432e9e3ec77e1b5cf"



const App = () => {
  const exploreRef = useRef(null);
  const scrollToRef = (ref) => ref.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
  const [showBeginMintModal, setShowBeginMintModal] = useState(false);
  const [nostrPublicKey, setNostrPublicKey] = useState(null);
  const [showReceiveAddressModal, setShowReceiveAddressModal] = useState(false);
  const [ownedUtxos, setOwnedUtxos] = useState([]);
  const [utxosReady, setUtxosReady] = useState(false)
  useEffect(() => {
    async function fetchUtxosForAddress() {
      if (!nostrPublicKey) return
      const address = getAddress()
      const response = await axios.get(`https://mempool.space/api/address/${address}/utxo`)
      setOwnedUtxos(response.data)
      setUtxosReady(true)
    }
    fetchUtxosForAddress()
  }, [nostrPublicKey]);

  async function connectWallet() {
    const pubkey = await window.nostr.getPublicKey()
    if (pubkey) {
      setNostrPublicKey(pubkey)
    }
  }

  function mempoolSpaceUrl(utxo) {
    return `https://mempool.space/tx/${utxo.txid}`
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
              Consider minting an <a href="https://astralbabes.ai" target="_blank">astral babe</a>.
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
        <Card className="my-2 mx-2">
          <Card.Body>
            <a href={mempoolSpaceUrl(it)} target="_blank">{shortenStr(it.txid)}:{it.vout}</a>
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
            <Nav.Link onClick={() => window.open("https://github.com")}>
              <SocialIcon url={"https://github.com"} />
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
            <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={() => connectWallet()}>Connect Nostr</Button>
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
              Sending and directly viewing actual images are not implemented yet, but will be soon!
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
