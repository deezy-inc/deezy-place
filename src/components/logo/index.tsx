import Image from "next/image";
import Anchor from "@ui/anchor";
import clsx from "clsx";

interface LogoProps {
    className?: string;
    path?: string;
    logo: {
        src: string;
        alt?: string;
    }[];
}

const Logo = ({ className, logo, path }: LogoProps) => (
    <div className={clsx("logo-thumbnail logo-custom-css", className)}>
        {logo?.[0]?.src && (
            <Anchor className="logo-light" path={path || "/"}>
                <Image src={logo[0].src} alt={logo[0]?.alt || "logo"} width={106} height={35} priority />
            </Anchor>
        )}
        {logo?.[1]?.src && (
            <Anchor className="logo-dark" path={path || "/"}>
                <Image src={logo[1].src} alt={logo[1]?.alt || "logo"} width={106} height={35} priority />
            </Anchor>
        )}
    </div>
);


export default Logo;
