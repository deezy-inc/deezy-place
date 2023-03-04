import type { ActionArgs, LoaderArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useSubmit, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import HeroSection from "~/components/HeroSection";
import NavBar from "~/components/NavBar";
import SendInscriptionModal from "~/components/modals/SendInscriptionModal";
import { getAddressInfo, getUtxos, getInscriptionUtxo, checkContentType } from "~/services.server";
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
