/* eslint no-extra-boolean-cast: "off" */

import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import Logo from "@components/logo";
import MainMenu from "@components/menu/main-menu";
import MobileMenu from "@components/menu/mobile-menu";
import UserDropdown from "@components/user-dropdown";
import { useOffcanvas } from "@hooks";
import BurgerButton from "@ui/burger-button";
import Button from "@ui/button";
import WalletContext from "@context/wallet-context";
import ConnectWallet from "@components/modals/connect-wallet";
import headerData from "../data/general/header.json";
import menuData from "../data/general/menu.json";

const Header = React.forwardRef(({ className, onConnectHandler, onDisconnectHandler }, ref) => {
    const { offcanvas, offcanvasHandler } = useOffcanvas();
    const { nostrPublicKey, nostrAddress, ethProvider } = useContext(WalletContext);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const handleShowConnectModal = () => {
        setShowConnectModal((prev) => !prev);
    };

    return (
        <>
            <header
                ref={ref}
                className={clsx(
                    "rn-header header-default black-logo-version header--fixed header--sticky sticky",
                    className
                )}
            >
                <div className="container">
                    <div className="header-inner">
                        <div className="header-left">
                            <Logo logo={headerData.logo} />
                            <div className="mainmenu-wrapper">
                                <nav id="sideNav" className="mainmenu-nav d-none d-xl-block">
                                    <MainMenu menu={menuData} />
                                </nav>
                            </div>
                        </div>
                        <div className="header-right">
                            {!Boolean(nostrPublicKey) && (
                                <div className="setting-option header-btn">
                                    <div className="setting-option rn-icon-list user-account">
                                        <Button
                                            color="primary-alta"
                                            className="connectBtn"
                                            size="small"
                                            onClick={handleShowConnectModal}
                                        >
                                            Connect Wallet
                                        </Button>
                                        <ConnectWallet
                                            show={showConnectModal}
                                            onConnect={onConnectHandler}
                                            handleModal={handleShowConnectModal}
                                            ethProvider={ethProvider}
                                        />
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
                            <div className="setting-option mobile-menu-bar d-block d-xl-none">
                                <div className="hamberger">
                                    <BurgerButton onClick={offcanvasHandler} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <MobileMenu isOpen={offcanvas} onClick={offcanvasHandler} menu={menuData} logo={headerData.logo} />
        </>
    );
});

Header.propTypes = {
    className: PropTypes.string,
    onConnectHandler: PropTypes.func,
    onDisconnectHandler: PropTypes.func,
};

export default Header;
