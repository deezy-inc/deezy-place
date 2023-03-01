import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import HeroSection from "~/components/HeroSection";
import NavBar from "~/components/NavBar";
import SendInscriptionModal from "~/components/modals/SendInscriptionModal";
import { getAddressInfo, getUtxos, checkIfInscriptionExists, getPreviousTxOfUtxo, checkContentType, getPreviousTrasactions } from "~/services.server";
import { createUserSession, getNostrPublicKey, logout } from "~/session.server";
import { connectWallet } from "~/utils";
import { Utxo } from "~/types";
import InscriptionList from "~/components/InscriptionList";

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
    return {
      status: await checkIfInscriptionExists(utxo),
      utxo: { ...utxo, contentType: await checkContentType(utxo) }
    }
  }))

  let formatInscriptionedUtxos = inscriptionedUtxos.filter(({ status }) => status === 200).map(x => x.utxo)
  let restOfTheFirstInscriptions = inscriptionedUtxos.filter(({ status }) => status !== 200).map(x => x.utxo)
  // let utxosWithRightTransactions = await getPreviousTrasactions(restOfTheFirstInscriptions)
  // ...utxosWithRightTransactions
  return json({ address, inscriptions: [...formatInscriptionedUtxos] })
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const action = formData.get('action');
  if (action === 'logout') {
    return await logout(request)
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
  const [inscription, setInscription] = useState(null);
  const { address, inscriptions } = useLoaderData() as { address: string, inscriptions: Utxo[] };
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


  const handleSendInscription = () => {

  }

  return (
    <div className="bg-gray-800">
      <NavBar address={address} handleConnectWallet={handleConnectWallet} handleDisconnectFromWallet={handleDisconnectFromWallet} />
      {!address && <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <HeroSection handleConnectWallet={handleConnectWallet} />
      </div>}
      <InscriptionList inscriptions={inscriptions} setInscription={setInscription} />
      <SendInscriptionModal handleSendInscription={handleSendInscription} inscription={inscription} onClose={() => setInscription(null)} />
    </div>
  );
}
