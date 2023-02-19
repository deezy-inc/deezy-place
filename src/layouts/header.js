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

const Header = ({ className }) => {
    const sticky = useSticky();
    const { offcanvas, offcanvasHandler } = useOffcanvas();
    const [nostrPubKey, setNostrPubKey] = useState();
    const [addressInfo, setAddressInfo] = useState();

    useEffect(() => {
        if (nostrPubKey) {
            SessionStorage.set(
                SessionsStorageKeys.NOSTR_PUBLIC_KEY,
                nostrPubKey
            );
        }
    }, [nostrPubKey]);

    useEffect(() => {
        async function getAddrInfo() {
            // TODO: We should ask the browser if we are connected to the wallet
            const nostrPubKey = SessionStorage.get(
                SessionsStorageKeys.NOSTR_PUBLIC_KEY
            );

            if (nostrPubKey) {
                setNostrPubKey(nostrPubKey);
                const addressInfo = await getAddressInfo(nostrPubKey);
                setAddressInfo(addressInfo);
            }
        }

        getAddrInfo();
    }, []);

    // TODO: Implement connection to wallet
    const onConnect = async () => {
        const pubKey = await connectWallet();

        console.log(addressInfo);
        setNostrPubKey(pubKey);
    };

    const onDisconnect = async () => {
        setNostrPubKey(undefined);
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
                            {!Boolean(nostrPubKey) && (
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
                            {Boolean(nostrPubKey) && (
                                <div className="setting-option rn-icon-list user-account">
                                    <UserDropdown
                                        onDisconnect={onDisconnect}
                                        pubKey={nostrPubKey}
                                        receiveAddress={addressInfo.address}
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
