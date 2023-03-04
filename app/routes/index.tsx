import type { ActionArgs, LoaderArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useSubmit, useLoaderData, useActionData } from "@remix-run/react";
import { useEffect, useState } from "react";
import HeroSection from "~/components/HeroSection";
import NavBar from "~/components/NavBar";
import SendInscriptionModal from "~/components/modals/SendInscriptionModal";
import { getAddressInfo, getUtxos, getInscriptionUtxo, checkContentType, sendInscription } from "~/services.server";
import { createUserSession, getNostrPublicKey, logout } from "~/session.server";
import { connectWallet } from "~/utils";
import type { Utxo } from "~/types";
import InscriptionList from "~/components/InscriptionList";
import NoInscriptions from "~/components/NoInscriptions";

export async function loader({ request }: LoaderArgs) {
  const nostrPublicKey = await getNostrPublicKey(request)
  if (typeof nostrPublicKey !== 'string') {
    return {
      address: null,
      inscriptions: []
    }
  }

  const { address } = getAddressInfo(nostrPublicKey)
  if (!address) return { address: null, inscriptions: [] }

  const utxos: Utxo[] = await getUtxos(address);
  let inscriptionedUtxos = await Promise.all(utxos.map(async (utxo) => {
    const inscriptionUtxo = await getInscriptionUtxo(utxo) 
    return {
      ...utxo, ...inscriptionUtxo, contentType: await checkContentType(utxo) 
    }
  }))

  return json({ address, inscriptions: inscriptionedUtxos })
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const action = formData.get('action');
  if (action === 'logout') {
    return await logout(request)
  }

  if (action === 'send-inscription') {
    const nostrPublicKey = await getNostrPublicKey(request)
    const bitcoinAddress = formData.get('bitcoinAddress');
    const feeRate = formData.get('feeRate');
    const value = formData.get('value');
    const txid = formData.get('txid');
    const vout = formData.get('vout');
    if ( !vout || !value) return false
    console.log('server', { nostrPublicKey,bitcoinAddress, feeRate, value, txid, vout  })
    return sendInscription({ nostrPublicKey, bitcoinAddress, feeRate, value: parseInt(value), txid, vout: parseInt(vout) });
  }

  const nostrPublicKey = formData.get('nostrPublicKey');
  if (typeof nostrPublicKey != 'string') return

  return await createUserSession({
    request,
    nostrPublicKey,
    remember: true,
  });
}

export default function Index() {
  const [inscription, setInscription] = useState<null | Utxo>(null);
  const { address, inscriptions } = useLoaderData() as { address: string, inscriptions: Utxo[] };
  const actionData = useActionData()
  const submit = useSubmit()

  const handleConnectWallet = async () => {
    const nostrPublicKey = await connectWallet()
    let formData = new FormData()
    formData.set("nostrPublicKey", nostrPublicKey)
    submit(formData, { method: "post" })
  }

  const handleDisconnectFromWallet = async () => {
    let formData = new FormData()
    formData.set("action", 'logout')
    submit(formData, { method: "post" })
  }

  const handleSendInscription = ({ bitcoinAddress, feeRate}: {bitcoinAddress: string, feeRate: number}) => {
    console.log('okay', feeRate, inscription)
    if (!feeRate || !inscription?.value) return false
    let formData = new FormData()
    formData.set("action", 'send-inscription')
    formData.set("bitcoinAddress", bitcoinAddress)
    formData.set("feeRate", feeRate + '')
    formData.set("value", inscription.value.toString())
    formData.set("txid", inscription.txid.toString())
    formData.set("vout", inscription.vout.toString())

    submit(formData, { method: "post" }) 
  }

  useEffect(()=> {
    const sign = async (sigHash: Buffer) => {
      console.log('sig hash hex', sigHash.toString('hex'))
      const sig = await window.nostr.signSchnorr(sigHash.toString('hex'))
      console.log('sig', sig)
    }
    if (actionData?.sigHash) {
      console.log('signed', sign(actionData.sigHash))
    }
  }, [actionData])

  return (
    <div className="bg-gray-800 min-h-screen">
      <NavBar address={address} handleConnectWallet={handleConnectWallet} handleDisconnectFromWallet={handleDisconnectFromWallet} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <HeroSection handleConnectWallet={handleConnectWallet} address={address} />
      </div>
      {!inscriptions.length && address && <NoInscriptions address={address} />}
      <InscriptionList inscriptions={inscriptions} setInscription={setInscription} />
      <SendInscriptionModal handleSendInscription={handleSendInscription} inscription={inscription} onClose={() => setInscription(null)} />
    </div>
  );
}
