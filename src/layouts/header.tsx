/* eslint no-extra-boolean-cast: "off" */
import React, { useContext } from "react";
import clsx from "clsx";

import Logo from "@components/logo";
import UserDropdown from "@components/user-dropdown";
import Button from "@ui/button";
import WalletContext from "@context/wallet-context";
import headerData from "../data/general/header.json";

const Header = React.forwardRef(({ className, onConnectHandler, onDisconnectHandler }: HeaderProps, ref) => {
    const { nostrPublicKey, nostrAddress } = useContext(WalletContext);

    return (
        <>
            <header
                ref={ref}
                className={clsx(
                    "rn-header haeder-default black-logo-version header--fixed header--sticky sticky",
                    className
                )}
            >
                <div className="container">
                    <div className="header-inner">
                        <div className="header-left">
                            <Logo logo={headerData.logo} />
                        </div>
                        <div className="header-right">
                            {!Boolean(nostrPublicKey) && (
                                <div className="setting-option header-btn">
                                    <div className="icon-box">
                                        <Button
                                            color="primary-alta"
                                            className="connectBtn"
                                            size="small"
                                            onClick={onConnectHandler}
                                        >
                                            Connect Wallet
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {nostrPublicKey && nostrAddress && (
                                <div className="setting-option rn-icon-list user-account">
                                    <UserDropdown
                                        onDisconnect={onDisconnectHandler}
                                        pubKey={nostrPublicKey}
                                        receiveAddress={nostrAddress}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
});

interface HeaderProps {
    className?: string;
    onConnectHandler: () => void;
    onDisconnectHandler: () => void;
};

export default Header;
