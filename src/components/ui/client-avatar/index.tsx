import PropTypes from "prop-types";
import clsx from "clsx";
import Image from "next/image";
import Anchor from "@ui/anchor";
import { ImageType } from "@utils/types";

const ClientAvatar = ({ slug, name, image, className }: ClientAvatarProps) => (
    <div className={clsx("avatar", className)}>
        <Image
            src={image.src}
            alt={image?.alt || name || "Ordinal Image"}
            width={image?.width || 30}
            height={image?.height || 30}
        />
    </div>
);

interface ClientAvatarProps {
    slug: string;
    name: string;
    image: ImageType;
    className: string;
}

export default ClientAvatar;
