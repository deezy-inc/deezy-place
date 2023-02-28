import { classNames, cloudfrontUrl, ordinalsImageUrl, shortenStr } from "~/utils";
import { Button } from "./elements/Button";
import { Utxo } from "~/types";
import { useEffect, useState } from "react";

export default function InscriptionCard({ inscription, setInscription }: { inscription: Utxo, setInscription: (value: Utxo) => void }) {
  const [content, setContent] = useState("")
  const url = inscription?.status?.confirmed ? ordinalsImageUrl(inscription) : cloudfrontUrl(inscription)
  const isImage = inscription?.contentType?.startsWith('image')
  useEffect(() => {
    if (!isImage) {
      fetch(url).then(res => res.text()).then((content) => {
        setContent(content)
      })
    }
  }, [])

  const createMarkup = (content: string) => {
    return { __html: content }
  }

  return (
    <div
      key={inscription.txid}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-yellow-700 bg-gray-700"
    >
      <div className={classNames(isImage ? 'w-full overflow-hidden rounded-md group-hover:opacity-75 lg:aspect-none min-h-80' : '', 'lg:h-80 aspect-w-1 aspect-h-1')}>
        {isImage ?
          <img
            src={url}
            alt={inscription.txid}
            className="h-full w-full object-cover object-center sm:h-full sm:w-full"
          /> : <div className="flex justify-center items-center h-full w-full" dangerouslySetInnerHTML={createMarkup(content)}></div>
        }
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-sm font-medium text-white overflow-hidden">
          <span>
            {shortenStr(inscription.txid)}
          </span>
        </h3>
        {setInscription &&
          <div className="flex justify-between">
            <div>
              <p className="text-base font-medium text-yellow-400">
                {inscription.value} sats
                <br />
                <span className="text-xs text-gray-400">{` ${!inscription.status?.confirmed
                  ? "Unconfirmed"
                  : new Date(
                    inscription.status?.block_time * 1000
                  ).toLocaleString()
                  }`}</span>
              </p>
            </div>
            <div className="py-2">
              <Button label="Send" onClick={() => setInscription(inscription)} />
            </div>
          </div>
        }
      </div>
    </div >
  )
}
