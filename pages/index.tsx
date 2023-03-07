import Head from 'next/head'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from "tiny-secp256k1";
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371.js";
import { checkContentType, getAddressInfo, getInscriptionUtxo, getUtxos } from '@/src/services.server'
import { Utxo } from '@/src/types'
import NavBar from '@/src/components/NavBar'
import HeroSection from '@/src/components/HeroSection'
import InscriptionList from '@/src/components/InscriptionList'
import SendInscriptionModal from '@/src/components/modals/SendInscriptionModal'
import NoInscriptions from '@/src/components/NoInscriptions'
import { connectWallet, toXOnly } from '@/src/utils'
import { useEffect, useState } from 'react'
import { ASSUMED_TX_BYTES, TESTNET } from '@/src/constants'

bitcoin.initEccLib(ecc);

export default function Home() {
  const [ inscriptions, setInscriptions ] = useState<Utxo[]>([]);
  const [nostrPublicKey, setNostrPublicKey ] = useState("");
  const [inscription, setInscription] = useState<null | Utxo>(null);
  const [address, setAddress ] = useState("");

  useEffect(() => {
    const fetchInscriptions = async () => {
      const { address } = getAddressInfo(nostrPublicKey)
      if (!address) return { address: null, inscriptions: [] }
      setAddress(address)

      const utxos: Utxo[] = await getUtxos(address);
      let inscriptionedUtxos = await Promise.all(utxos.map(async (utxo) => {
        const inscriptionUtxo = await getInscriptionUtxo(utxo) 
        return {
          ...utxo, ...inscriptionUtxo, contentType: await checkContentType(utxo) 
        }
      }))
      setInscriptions(inscriptionedUtxos)
    }
    if (nostrPublicKey) {
      fetchInscriptions()
    }
  }, [nostrPublicKey])

  
  const handleConnectWallet = async () => {
    const nostrPublicKey = await connectWallet()
    setNostrPublicKey(nostrPublicKey)
  }


  const handleDisconnectFromWallet = async () => {
  }

  const handleSendInscription = async ({ bitcoinAddress, feeRate}: {bitcoinAddress: string, feeRate: number}) => {
    const inputAddressInfo = getAddressInfo(nostrPublicKey)
    const psbt = new bitcoin.Psbt({ network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin })
    const publicKey = Buffer.from(await window.nostr.getPublicKey(), 'hex')

    if (!inscription || !inscription.value || !inputAddressInfo.output) return 

    const inputParams = {
      hash: inscription.txid,
      index: parseInt(inscription.vout),
      witnessUtxo: {
        value: inscription.value,
        script: inputAddressInfo.output
      },
      tapInternalKey: toXOnly(publicKey)
    };
    console.log(inputParams)
    psbt.addInput(inputParams)
    psbt.addOutput({
      address: bitcoinAddress,
      value: inscription.value - feeRate * ASSUMED_TX_BYTES
    })
    // @ts-ignore
    const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(0, [inputAddressInfo.output], [inscription.value], bitcoin.Transaction.SIGHASH_DEFAULT)
    const sig = await window.nostr.signSchnorr(sigHash.toString('hex'))
    psbt.updateInput(0, {
      tapKeySig: serializeTaprootSignature(Buffer.from(sig, 'hex'))
    })
    psbt.finalizeAllInputs()
    const tx = psbt.extractTransaction()
    const hex = tx.toBuffer().toString('hex')
    const fullTx = bitcoin.Transaction.fromHex(hex)
    const res = await fetch(`https://mempool.space/api/tx`, { 
        method: 'POST', 
        body: JSON.stringify(hex) 
      }).catch(err => {
        console.error(err)
        alert(err)
        return null
      })
    if (!res) return false
    return true
  }

  return (
    <>
      <Head>
        <title>Deezy | Nosft</title>
        <meta name="description" content="Nosft your bitcoin wallet for inscriptions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>" />
      </Head>
      <main>
    <div className="bg-gray-800 min-h-screen">
      <NavBar address={address} handleConnectWallet={handleConnectWallet} handleDisconnectFromWallet={handleDisconnectFromWallet} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <HeroSection handleConnectWallet={handleConnectWallet} address={address} />
      </div>
      {!inscriptions.length && address && <NoInscriptions address={address} />}
      <InscriptionList inscriptions={inscriptions} setInscription={setInscription} />
      <SendInscriptionModal handleSendInscription={handleSendInscription} inscription={inscription} onClose={() => setInscription(null)} />
    </div>
      </main> 
    </>
  )
}
