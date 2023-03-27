import PropTypes from "prop-types";
import Anchor from "@ui/anchor";

const SubMenu = ({ menu }: SubMenuProps) => (
    <ul className="submenu">
        {menu.map((nav) => (
            <li key={nav.id}>
                <Anchor path={nav.path} className={nav.isLive ? "live-expo" : ""}>
                    {nav.text}
                    {nav?.icon && <i className={`feather ${nav.icon}`} />}
                </Anchor>
            </li>
        ))}
    </ul>
);

export interface SubMenuProps {
    menu: { 
        id: string;
        path: string;
        isLive: boolean;
        text: string;
        icon?: string;
    }
}

export default SubMenu;
