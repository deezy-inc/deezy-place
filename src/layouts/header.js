/* eslint no-extra-boolean-cast: "off" */

import React, { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import Logo from "@components/logo";
import MainMenu from "@components/menu/main-menu";
import MobileMenu from "@components/menu/mobile-menu";
import UserDropdown from "@components/user-dropdown";
import { useOffcanvas } from "@hooks";
import BurgerButton from "@ui/burger-button";
import Button from "@ui/button";
import { useWallet } from "@context/wallet-context";
import ConnectWallet from "@components/modals/connect-wallet";
import { TESTNET, INSCRIBOR_URL } from "@services/nosft";
import menuData from "../data/general/menu";
import headerData from "../data/general/header.json";

const Header = React.forwardRef(({ className }, ref) => {
    const { ordinalsPublicKey, nostrOrdinalsAddress, onShowConnectModal } =
        useWallet();

    const { offcanvas, offcanvasHandler } = useOffcanvas();

    return (
        <>
            <header
                ref={ref}
                className={clsx(
                    "rn-header header-default black-logo-version header--fixed header--sticky sticky",
                    className
                )}
            >
                {TESTNET && (
                    <div className="testnet">
                        <p className="rightToLeft">YOU ARE USING TESTNET!</p>
                    </div>
                )}
                <div className="container">
                    <div className="header-inner">
                        <div className="header-left">
                            <Logo logo={headerData.logo} />
                            <div className="mainmenu-wrapper">
                                <nav
                                    id="sideNav"
                                    className="mainmenu-nav d-none d-xl-block"
                                >
                                    <MainMenu menu={menuData(INSCRIBOR_URL)} />
                                </nav>
                            </div>
                        </div>
                        <div className="header-right">
                            {!Boolean(ordinalsPublicKey) && (
                                <div className="setting-option header-btn">
                                    <div className="setting-option rn-icon-list user-account">
                                        <Button
                                            color="primary-alta"
                                            className="connectBtn"
                                            size="small"
                                            onClick={onShowConnectModal}
                                        >
                                            Connect Wallet
                                        </Button>

                                        <ConnectWallet />
                                    </div>
                                </div>
                            )}
                            {ordinalsPublicKey && nostrOrdinalsAddress && (
                                <div className="setting-option rn-icon-list user-account">
                                    <UserDropdown />
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
            <MobileMenu
                isOpen={offcanvas}
                onClick={offcanvasHandler}
                menu={menuData(INSCRIBOR_URL)}
                logo={headerData.logo}
            />
        </>
    );
});

Header.propTypes = {
    className: PropTypes.string,
};

export default Header;
