import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Network, validate } from 'bitcoin-address-validation'
import { Utxo } from '~/types'
import { Button } from '../elements/Button'
import InscriptionCard from '../InscriptionCard'
import { Input } from '../elements/Input'
import { DEFAULT_FEE_RATE, TESTNET } from '~/constants'

export default function SendInscriptionModal({ inscription, onClose }: { inscription: Utxo | null, onClose: (value: boolean) => void }) {
  const [open, setOpen] = useState(true)
  const [bitcoinAddress, setBitcoinAddress] = useState("")
  const [error, setError] = useState({ bitcoinAddress: "" })
  const [feeRate, setFeeRate] = useState(DEFAULT_FEE_RATE)

  const handleBitcoinAddress = (address: string) => {
    setBitcoinAddress(address)
    if (!validate(address, TESTNET ? Network.testnet : Network.mainnet)) {
      setError({
        bitcoinAddress: "Invalid bitcoin address"
      })
    } else {
      setError({
        bitcoinAddress: ""
      })
    }
  }

  const handleClose = (e: any) => {
    setBitcoinAddress("")
    setError({ bitcoinAddress: "" })
    setFeeRate(DEFAULT_FEE_RATE)
    onClose(e)
  }

  const cancelButtonRef = useRef(null)

  return (
    <Transition.Root show={open && !!inscription} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-700 text-left shadow-xl transition-all sm:my-8 w-full sm:max-w-lg">
                <div className="bg-gray-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  {inscription &&
                    <InscriptionCard inscription={inscription} />
                  }
                </div>
                <div className="bg-gray-900 px-4 py-3 sm:px-6">
                  <div className="space-y-6 mb-4">
                    <Input
                      label="Send NFT to this bitcoin address"
                      name="bitcoinAddress"
                      value={bitcoinAddress}
                      type="text"
                      error={error && error?.bitcoinAddress}
                      onChange={(e) => handleBitcoinAddress(e.target.value)}
                    />
                    <Input
                      label={`Fee rate - ${feeRate}`}
                      name="feeRate"
                      min="1"
                      max="50"
                      step="1"
                      type="range"
                      value={feeRate}
                      noStyle
                      extraStyles="w-full"
                      onChange={(e) => setFeeRate(parseInt(e.target.value))} />
                    <Button
                      extraClasses="w-full"
                      primary
                      type="button"
                      onClick={() => setOpen(false)}
                      label="Send"
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root >
  )
}
