import { Button } from "./elements/Button";

interface HeroSectionProps {
  handleConnectWallet?: () => void;
}

export default function HeroSection({ handleConnectWallet }: HeroSectionProps) {
  return (
    <div className="relative isolate">
      <div className="px-6 py-10 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
          <h1 className="text-white mt-10 max-w-lg text-4xl tracking-tight sm:text-6xl">
            Keep your NFTs secure and accessible with our Bitcoin web wallet.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            Our Bitcoin web wallet is the perfect solution for anyone who wants to store and manage their ordinal inscription NFTs in a safe and convenient way.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button primary label="Connect Wallet" size="large" onClick={handleConnectWallet} />
          </div>
        </div>
        <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 mx-auto lg:flex-grow md:max-w-md max-w-2xl">
          <img src="/babe.png" alt="nft-babe" />
        </div>
      </div>
    </div>
  )
}

