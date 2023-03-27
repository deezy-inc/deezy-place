import PropTypes from "prop-types";
import Anchor from "@ui/anchor";
import clsx from "clsx";
import SubMenu, { SubMenuProps } from "./submenu";
import MegaMenu, { MegaMenuProps } from "./megamenu";

const MainMenu = ({ menu }: MainMenuProps) => (
    <ul className="mainmenu">
        {menu.map((nav) => (
            <li
                key={nav.id}
                className={clsx(
                    !!nav.submenu && "has-droupdown has-menu-child-item",
                    !!nav.megamenu && "with-megamenu"
                )}
            >
                <Anchor className="its_new" path={nav.path}>
                    {nav.text}
                </Anchor>
                {nav?.submenu && <SubMenu menu={nav.submenu} />}
                {nav?.megamenu && <MegaMenu menu={nav.megamenu} />}
            </li>
        ))}
    </ul>
);

interface MainMenuProps {
    menu: {
        id: string;
        submenu?: SubMenuProps;
        megamenu?: MegaMenuProps;
    }[];
}

export default MainMenu;
