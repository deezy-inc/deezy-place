import { createContext } from "react";

const WalletContext = createContext({
    nostrPublicKey: null,
    nostrAddress: null,
    isExperimental: false,
});

export default WalletContext;
