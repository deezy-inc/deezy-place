/* eslint no-extra-boolean-cast: "off" */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import Logo from "@components/logo";
import MainMenu from "@components/menu/main-menu";
import { getAddressInfo, connectWallet } from "@utils/crypto";
import MobileMenu from "@components/menu/mobile-menu";
import UserDropdown from "@components/user-dropdown";

import { useOffcanvas, useSticky } from "@hooks";

import Button from "@ui/button";
import BurgerButton from "@ui/burger-button";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

import headerData from "../data/general/header.json";
import menuData from "../data/general/menu.json";

const Header = ({ className, setNostrPublicKey, nostrPublicKey, address }) => {
    const sticky = useSticky();
    const { offcanvas, offcanvasHandler } = useOffcanvas();

    useEffect(() => {
        async function getAddrInfo() {
            if (nostrPublicKey) {
                SessionStorage.set(
                    SessionsStorageKeys.NOSTR_PUBLIC_KEY,
                    nostrPublicKey
                );
            }
        }

        getAddrInfo();
    }, [nostrPublicKey]);

    // TODO: Use @state instead of @sessionStorage
    useEffect(() => {
        // TODO: We should ask the browser if we are connected to the wallet
        const pubKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);

        if (pubKey) {
            setNostrPublicKey(pubKey);
        }
    }, []);

    const onConnect = async () => {
        const pubKey = await connectWallet();
        setNostrPublicKey(pubKey);
    };

    const onDisconnect = async () => {
        setNostrPublicKey(undefined);
        SessionStorage.remove(SessionsStorageKeys.NOSTR_PUBLIC_KEY);
    };

    return (
        <>
            <header
                className={clsx(
                    "rn-header haeder-default black-logo-version header--fixed header--sticky",
                    sticky && "sticky",
                    className
                )}
            >
                <div className="container">
                    <div className="header-inner">
                        <div className="header-left">
                            <Logo logo={headerData.logo} />
                            <div className="mainmenu-wrapper">
                                <nav
                                    id="sideNav"
                                    className="mainmenu-nav d-none d-xl-block"
                                >
                                    <MainMenu menu={menuData} />
                                </nav>
                            </div>
                        </div>
                        <div className="header-right">
                            {!Boolean(nostrPublicKey) && (
                                <div className="setting-option header-btn">
                                    <div className="icon-box">
                                        <Button
                                            color="primary-alta"
                                            className="connectBtn"
                                            size="small"
                                            onClick={onConnect}
                                        >
                                            Connect Wallet
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {Boolean(nostrPublicKey) && Boolean(address) && (
                                <div className="setting-option rn-icon-list user-account">
                                    <UserDropdown
                                        onDisconnect={onDisconnect}
                                        pubKey={nostrPublicKey}
                                        receiveAddress={address}
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
            <MobileMenu
                isOpen={offcanvas}
                onClick={offcanvasHandler}
                menu={menuData}
                logo={headerData.logo}
            />
        </>
    );
};

Header.propTypes = {
    className: PropTypes.string,
};

export default Header;
