import { useState, useEffect } from "react";
import { connectWallet } from "@utils/wallet";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import LocalStorage from "@services/local-storage";

function useConnectWallet() {
    const [nostrPublicKey, setNostrPublicKey] = useState();
    const [utxosReady, setUtxosReady] = useState(false);

    const onConnectHandler = async (provider) => {
        const pubKey = await connectWallet(provider);
        SessionStorage.set(SessionsStorageKeys.DOMAIN, provider);
        setNostrPublicKey(pubKey);
    };

    const onDisconnectHandler = async () => {
        setNostrPublicKey(undefined);
        SessionStorage.clear();
        LocalStorage.clear();
        setUtxosReady(false);
    };

    useEffect(() => {
        async function getAddrInfo() {
            if (nostrPublicKey) {
                SessionStorage.set(SessionsStorageKeys.NOSTR_PUBLIC_KEY, nostrPublicKey);
            }
        }

        getAddrInfo();
    }, [nostrPublicKey]);

    useEffect(() => {
        // TODO: We should ask the browser if we are connected to the wallet
        const pubKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);

        if (pubKey) {
            setNostrPublicKey(pubKey);
        }
    }, []);

    return { nostrPublicKey, onConnectHandler, onDisconnectHandler };
}

export default useConnectWallet;
