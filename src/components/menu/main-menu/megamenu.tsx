import PropTypes from "prop-types";
import Anchor from "@ui/anchor";

const MegaMenu = ({ menu }: MegaMenuProps) => (
    <div className="rn-megamenu">
        <div className="wrapper">
            <div className="row row--0">
                {menu.map((nav) => (
                    <div key={nav.id} className="col-lg-3 single-mega-item">
                        {nav?.submenu && (
                            <ul className="mega-menu-item">
                                {nav.submenu.map((subnav) => (
                                    <li key={subnav.id}>
                                        <Anchor path={subnav.path}>
                                            {subnav.text}
                                            {subnav?.icon && <i className={`feather ${subnav.icon}`} />}
                                        </Anchor>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export interface MegaMenuProps {
    menu: {
        id: string; 
        submenu: { 
            id: string; 
            path: string; 
            text: string; 
            icon?: string;
        }
    }[];
}

export default MegaMenu;
