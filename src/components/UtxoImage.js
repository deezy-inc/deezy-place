import { ordinalsImageUrl } from "../utils"
export default function UtxoImage({ utxo, style, inscriptionUtxosByUtxo }) {
  return (<img
    alt=""
    src={utxo.status.confirmed ? ordinalsImageUrl(inscriptionUtxosByUtxo[`${utxo.txid}:${utxo.vout}`]) : cloudfrontUrl(utxo)}
    style={style}
    className="mb-3"
  />)
}