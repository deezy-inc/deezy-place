import { useState, useEffect } from "react";
import { connectWallet } from "@utils/crypto";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import LocalStorage from "@services/local-storage";

function useConnectWallet() {
    const [nostrPublicKey, setNostrPublicKey] = useState();

    const onConnectHandler = async () => {
        const pubKey = await connectWallet();
        setNostrPublicKey(pubKey);
    };

    const onDisconnectHandler = async () => {
        setNostrPublicKey(undefined);
        SessionStorage.clear();
        LocalStorage.clear();
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
