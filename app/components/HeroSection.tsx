import { Button } from "./elements/Button";

interface HeroSectionProps {
  handleConnectWallet?: () => void;
}

export default function HeroSection({ handleConnectWallet }: HeroSectionProps) {
  return (
    <div className="relative px-6 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-100 sm:text-6xl">
            Keep your NFTs secure and accessible with our Bitcoin web wallet.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            Our Bitcoin web wallet is the perfect solution for anyone who wants to store and manage their ordinal inscription NFTs in a safe and convenient way.
          </p>
          <div className="mt-10 flex items-center justify-center">
            <Button primary label="Connect Wallet" size="large" onClick={handleConnectWallet} />
          </div>
        </div>
      </div>
    </div>
  )
}

