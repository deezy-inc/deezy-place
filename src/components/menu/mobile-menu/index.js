import PropTypes from "prop-types";
import clsx from "clsx";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "@ui/offcanvas";
import Anchor from "@ui/anchor";
import Logo from "@components/logo";
import { slideToggle, slideUp } from "@utils/methods";
import SubMenu from "./submenu";
import MegaMenu from "./megamenu";

const MobileMenu = ({ isOpen, onClick, menu, logo }) => {
    const onClickHandler = (e) => {
        e.preventDefault();
        const { target } = e;
        const {
            parentElement: {
                parentElement: { childNodes },
            },
            nextElementSibling,
        } = target;
        slideToggle(nextElementSibling);
        childNodes.forEach((child) => {
            if (child.id === target.parentElement.id) return;
            if (child.classList.contains("has-children")) {
                slideUp(child.lastElementChild);
            }
        });
    };
    return (
        <Offcanvas isOpen={isOpen} onClick={onClick}>
            <OffcanvasHeader onClick={onClick}>
                <Logo logo={logo} />
            </OffcanvasHeader>
            <OffcanvasBody>
                <nav>
                    <ul className="mainmenu">
                        {menu?.map((nav) => {
                            const hasChildren = !!nav.submenu || !!nav.megamenu;
                            return (
                                <li
                                    className={clsx(
                                        !!nav.submenu && "has-droupdown",
                                        !!nav.megamenu && "with-megamenu",
                                        hasChildren && "has-children"
                                    )}
                                    id={nav.id}
                                    key={nav.id}
                                >
                                    <Anchor
                                        className="nav-link its_new"
                                        path={hasChildren ? "#!" : nav.path}
                                        onClick={
                                            hasChildren
                                                ? onClickHandler
                                                : (e) => e
                                        }
                                    >
                                        {nav.text}
                                    </Anchor>
                                    {nav?.submenu && (
                                        <SubMenu menu={nav.submenu} />
                                    )}
                                    {nav?.megamenu && (
                                        <MegaMenu menu={nav.megamenu} />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </OffcanvasBody>
        </Offcanvas>
    );
};

MobileMenu.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    menu: PropTypes.arrayOf(PropTypes.shape({})),
    logo: PropTypes.arrayOf(
        PropTypes.shape({
            src: PropTypes.string.isRequired,
            alt: PropTypes.string,
        })
    ),
};

export default MobileMenu;
