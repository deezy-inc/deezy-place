import React, { useState, useEffect } from 'react';
import './App.css';

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { SocialIcon } from 'react-social-icons';
import { BsDownload } from "react-icons/bs"
import ReceiveAddressModal from './components/modals/ReceiveAddressModal';
import ConfirmationModal from './components/modals/ConfirmationModal';
import SelectFeeRateModal from './components/modals/SelectFeeRateModal';
import SentModal from './components/modals/SentModal';
import BeginSendModal from './components/modals/BeginSendModal';
import UtxoModal from './components/modals/UtxoModal';
import UtxoInfo from './components/UtxoInfo';
import { getAddressInfo, connectWallet } from './utils';
import { TESTNET, GITHUB_URL, DEFAULT_FEE_RATE, INSCRIPTION_SEARCH_DEPTH, SENDS_ENABLED } from './constance';

const axios = require('axios')

export default function App() {
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

  useEffect(() => {
    async function fetchUtxosForAddress() {
      if (!nostrPublicKey) return
      const address = getAddressInfo(nostrPublicKey).address
      const response = await axios.get(`https://mempool.space/api/address/${address}/utxo`)
      const tempInscriptionsByUtxo = {}
      setOwnedUtxos(response.data)
      for (const utxo of response.data) {
        tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo
        // if (!utxo.status.confirmed) continue
        let currentUtxo = utxo
        console.log('utxo', utxo)

        console.log(`Checking utxo ${currentUtxo.txid}:${currentUtxo.vout}`)
        try {
          const res = await axios.get(`https://ordinals.com/output/${currentUtxo.txid}:${currentUtxo.vout}`)
          const inscriptionId = res.data.match(/<a href=\/inscription\/(.*?)>/)?.[1]
          const [txid, vout] = inscriptionId.split('i')
          currentUtxo = { txid, vout }
        } catch (err) {
          console.log(`Error from ordinals.com`)
        }
        tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = currentUtxo
        const newInscriptionsByUtxo = {}
        Object.assign(newInscriptionsByUtxo, tempInscriptionsByUtxo)
        setInscriptionUtxosByUtxo(newInscriptionsByUtxo)
        setUtxosReady(true)
      }
      setInscriptionUtxosByUtxo(tempInscriptionsByUtxo)
      setUtxosReady(true)
    }
    fetchUtxosForAddress()
  }, [nostrPublicKey]);

  return (
    <>
      <Navbar bg="dark" variant="dark" className="pt-5 pb-5">
        <Container>
          <Navbar.Brand className="flex-row">
            Nos-FT
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
              <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={() => setShowReceiveAddressModal(true)}>
                View Deposit Address<br /><BsDownload />
              </Button>
            </div>
            :
            <>
              <p>
                Welcome, Degen
              </p>
              <br />
              <Button variant="primary" className="mx-3 shadowed-orange-small" onClick={async () => {
                setNostrPublicKey(await connectWallet())
              }}>Connect Wallet</Button>
            </>
        }
        <br /><br />
        {nostrPublicKey && <UtxoInfo
          utxosReady={utxosReady}
          ownedUtxos={ownedUtxos}
          setShowUtxoModal={setShowUtxoModal}
          setCurrentUtxo={setCurrentUtxo}
          inscriptionUtxosByUtxo={inscriptionUtxosByUtxo}
        />}
      </Container>
      <ReceiveAddressModal
        showReceiveAddressModal={showReceiveAddressModal}
        setShowReceiveAddressModal={setShowReceiveAddressModal}
        nostrPublicKey={nostrPublicKey}
      />
      <UtxoModal
        setShowBeginSendModal={setShowBeginSendModal}
        setShowUtxoModal={setShowUtxoModal}
        showUtxoModal={showUtxoModal}
        currentUtxo={currentUtxo}
        SENDS_ENABLED={SENDS_ENABLED}
        inscriptionUtxosByUtxo={inscriptionUtxosByUtxo}
      />
      <BeginSendModal
        showBeginSendModal={showBeginSendModal}
        setShowBeginSendModal={setShowBeginSendModal}
        currentUtxo={currentUtxo}
        setIsBtcInputAddressValid={setIsBtcInputAddressValid}
        setDestinationBtcAddress={setDestinationBtcAddress}
        setShowSelectFeeRateModal={setShowSelectFeeRateModal}
        isBtcInputAddressValid={isBtcInputAddressValid}
        TESTNET={TESTNET}
        setShowUtxoModal={setShowUtxoModal}
        inscriptionUtxosByUtxo={inscriptionUtxosByUtxo}
      />
      <SelectFeeRateModal
        showSelectFeeRateModal={showSelectFeeRateModal}
        setShowSelectFeeRateModal={setShowSelectFeeRateModal}
        currentUtxo={currentUtxo}
        sendFeeRate={sendFeeRate}
        setSendFeeRate={setSendFeeRate}
        setShowBeginSendModal={setShowBeginSendModal}
        setShowConfirmSendModal={setShowConfirmSendModal}
        inscriptionUtxosByUtxo={inscriptionUtxosByUtxo}
      />
      <ConfirmationModal
        setShowConfirmSendModal={setShowConfirmSendModal}
        showConfirmSendModal={showConfirmSendModal}
        setShowSelectFeeRateModal={setShowSelectFeeRateModal}
        setShowSentModal={setShowSentModal}
        sendFeeRate={sendFeeRate}
        currentUtxo={currentUtxo}
        nostrPublicKey={nostrPublicKey}
        destinationBtcAddress={destinationBtcAddress}
        setSentTxid={setSentTxid}
        inscriptionUtxosByUtxo={inscriptionUtxosByUtxo}
      />
      <SentModal
        showSentModal={showSentModal}
        setShowSentModal={setShowSentModal}
        sentTxid={sentTxid}
      />
    </>
  )
}
