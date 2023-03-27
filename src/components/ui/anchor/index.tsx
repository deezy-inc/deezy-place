import Link from "next/link";
import { ReactNode } from "react";

const Anchor = ({
    path,
    children,
    className,
    rel = "noopener noreferrer",
    label,
    target = "_blank",
    onClick,
    ...rest
}: AnchorProps) => {
    if (!path) return null;
    const internal = /^\/(?!\/)/.test(path);
    if (!internal) {
        const isHash = path.startsWith("#");
        if (isHash) {
            return (
                <a aria-label={label} className={className} href={path} onClick={onClick} {...rest}>
                    {children}
                </a>
            );
        }
        return (
            <a
                aria-label={label}
                rel={rel}
                className={className}
                href={path}
                target={target}
                onClick={onClick}
                {...rest}
            >
                {children}
            </a>
        );
    }

    return (
        <Link rel="preload" href={path} className={className} aria-label={label} {...rest}>
            {children}
        </Link>
    );
};

interface AnchorProps {
    children: ReactNode;
    path: string;
    className?: string;
    rel?: string;
    label?: string;
    target?: "_blank" | "_self" | "_parent" | "_top";
    onClick?: () => void;
}

export default Anchor;
