import { createContext } from "react";

const WalletContext = createContext({
    nostrPublicKey: null,
    nostrAddress: null
});

export default WalletContext;
