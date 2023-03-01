import { Dispatch, SetStateAction } from "react";
import { Utxo } from "~/types";
import InscriptionCard from "./InscriptionCard";

export default function InscriptionList({ inscriptions, setInscription }: { inscriptions: Utxo[], setInscription: Dispatch<SetStateAction<null | Utxo>> }) {
  return (
    <div className="mx-auto max-w-3xl py-10 px-4 lg:max-w-7xl lg:px-8">
      <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
        {inscriptions?.map((inscription: Utxo) => (
          <InscriptionCard key={inscription.txid} inscription={inscription} setInscription={setInscription} />
        ))}
      </div>
    </div>
  )
}
