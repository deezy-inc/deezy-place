import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Anchor from "@ui/anchor";
import clsx from "clsx";
import SubMenu from "./submenu";
import MegaMenu from "./megamenu";
import { useWallet } from "@context/wallet-context";

const MainMenu = ({ menu }) => {
  const [currentPath, setCurrentPath] = useState("");
  const { nostrOrdinalsAddress } = useWallet();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  return (
    <ul className="mainmenu">
      {menu
        .filter(
          (optionMenu) =>
            !optionMenu.private || (optionMenu.private && nostrOrdinalsAddress)
        )
        .map((nav) => (
          <li
            key={nav.id}
            className={clsx(
              !!nav.submenu && "has-droupdown has-menu-child-item",
              !!nav.megamenu && "with-megamenu"
            )}
          >
            <Anchor
              className={clsx("its_new", currentPath === nav.path && "active")}
              path={nav.path}
            >
              {nav.text}
            </Anchor>
            {nav?.submenu && <SubMenu menu={nav.submenu} />}
            {nav?.megamenu && <MegaMenu menu={nav.megamenu} />}
          </li>
        ))}
    </ul>
  );
};

MainMenu.propTypes = {
  menu: PropTypes.arrayOf(PropTypes.shape({})),
};

export default MainMenu;
