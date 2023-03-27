import { ReactNode } from "react";
import clsx from "clsx";
import Anchor from "../anchor";

const Button = ({
    children,
    type = "button",
    label,
    onClick,
    className,
    path,
    size = "large",
    color = "primary",
    shape,
    disabled = false,
    fullwidth,
    ...rest
}: ButtonProps) => {
    if (path) {
        return (
            <Anchor
                label={label}
                onClick={onClick}
                className={clsx(
                    className,
                    "btn",
                    `btn-${size}`,
                    `btn-${color}`,
                    fullwidth && "w-100 d-block",
                    shape === "ellipse" && "rounded"
                )}
                path={path}
                {...rest}
            >
                <span>{children}</span>
            </Anchor>
        );
    }

    return (
        <button
            aria-label={label}
            onClick={onClick}
            className={clsx(
                className,
                "btn",
                `btn-${size}`,
                `btn-${color}`,
                fullwidth && "w-100 d-block",
                shape === "ellipse" && "rounded"
            )}
            type={type}
            {...rest}
        >
            <span>{children}</span>
        </button>
    );
};

interface ButtonProps {
    children: ReactNode;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    label?: string;
    onClick: () => void;
    className?: string;
    path?: string;
    size?: "large" | "small" | "medium";
    color?: "primary" | "primary-alta";
    shape?: "square" | "ellipse";
    fullwidth?: boolean;
}

export default Button;
