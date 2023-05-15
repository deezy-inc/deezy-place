import { createContext, useContext } from "react";

const WalletContext = createContext(null);

const useWallet = () => {
    const context = useContext(WalletContext);

    if (context === null) {
        throw new Error("useWallet must be used within a WalletContext.Provider");
    }

    return context;
};

export { WalletContext, useWallet };
