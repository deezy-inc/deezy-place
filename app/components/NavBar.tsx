import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { classNames, connectWallet } from '~/utils'
import { Button } from './elements/Button'

interface NavBarProps {
  address: string | undefined;
  handleConnectWallet?: () => void;
}

export default function Navbar({ handleConnectWallet, address }: NavBarProps) {
  return (
    <Disclosure as="nav" className="bg-gray-800 border-b border-b-yellow-400">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="-ml-2 mr-2 flex items-center md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="block h-8 w-auto lg:hidden"
                    src="/logo-white.svg"
                    alt="Nosft"
                  />
                  <img
                    className="hidden h-8 w-auto lg:block"
                    src="/logo-white.svg"
                    alt="Nosft"
                  />
                </div>
                <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {!address &&
                    <Button
                      onClick={handleConnectWallet}
                      primary={false}
                      label="Connect Wallet"
                    />
                  }
                </div>
                <div className="hidden md:ml-4 md:flex md:flex-shrink-0 md:items-center">
                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <img className="h-8 w-8 rounded-full border border-yellow-400" src="/nos-ft-logo.png" alt="" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item key="address">
                          {({ active }) => (
                            <button
                              onClick={() => { }}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700 w-full text-left'
                              )}
                            >
                              {address}
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item key="sign-out">
                          {({ active }) => (
                            <button
                              onClick={() => { }}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700 w-full text-left hover:text-red-500'
                              )}
                            >
                              Disconnect
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="border-t border-gray-700 pt-4 pb-3">
              <div className="flex items-center px-5 sm:px-6">
                <div className="flex-shrink-0">
                  <img className="h-10 w-10 rounded-full border border-yellow-400" src="/nos-ft-logo.png" alt="" />
                </div>
                <div className="ml-3">
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2 sm:px-3">
                <Disclosure.Button
                  key="address"
                  as="button"
                  onClick={() => { }}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  {address}
                </Disclosure.Button>
                <Disclosure.Button
                  key="sign-out"
                  as="button"
                  onClick={() => { }}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-red-500"
                >
                  Disconnect
                </Disclosure.Button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
