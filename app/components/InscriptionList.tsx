import { Utxo } from "~/types";
import InscriptionCard from "./InscriptionCard";

export default function InscriptionList({ inscriptions, setInscription }: { inscriptions: Utxo[] }) {
  return (
    <div className="mx-auto max-w-2xl py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
      <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8">
        {inscriptions?.map((inscription: Utxo) => (
          <InscriptionCard key={inscription.txid} inscription={inscription} setInscription={setInscription} />
        ))}
      </div>
    </div>
  )
}
