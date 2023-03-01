import { Button } from "./elements/Button";

export default function NoInscriptions({ address }: { address: string }) {
    return (
        <div className="mx-auto max-w-7xl pb-16 sm:px-6 lg:px-8">
            <div className="relative isolate overflow-hidden px-6 text-center sm:px-16">
                <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    This address doesn't own anything yet..
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                    Consider minting an astral babe
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <a
                        href="https://astralbabes.ai" target="_blank"
                        className="bg-yellow-500 text-gray-800 font-semibold rounded-md shadow-lg shadow-yellow-500/50 border border-yellow-500 px-6 py-3 text-lg"
                    >
                        Get started
                    </a>
                </div>
            </div>
        </div>
    )
}
