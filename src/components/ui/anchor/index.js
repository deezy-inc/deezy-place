import Link from "next/link";
import PropTypes from "prop-types";

const Anchor = ({ path, children, className, rel, label, target, onClick, ...rest }) => {
    if (!path) return <div>{children}</div>;
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
        // External links must be http(s): API-supplied URLs (e.g. collection
        // links) could otherwise carry javascript:/data: schemes
        if (!/^https?:\/\//i.test(path)) {
            return <div className={className}>{children}</div>;
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

Anchor.defaultProps = {
    target: "_blank",
    rel: "noopener noreferrer",
};

Anchor.propTypes = {
    children: PropTypes.node.isRequired,
    path: PropTypes.string.isRequired,
    className: PropTypes.string,
    rel: PropTypes.string,
    label: PropTypes.string,
    target: PropTypes.oneOf(["_blank", "_self", "_parent", "_top"]),
    onClick: PropTypes.func,
};

Anchor.displayName = "Anchor";

export default Anchor;
