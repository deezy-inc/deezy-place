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
            console.log(`No inscription for ${inscriptionId}`)
            currentDepth++
            // get previous vin
            const txResp = await axios.get(`https://mempool.space/api/tx/${currentUtxo.txid}`)
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
          inscriptionUtxosByUtxo={setCurrentUtxo}
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
        currentUtxo={currentUtxo}
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
