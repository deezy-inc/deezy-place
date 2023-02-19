import PropTypes from "prop-types";
import clsx from "clsx";
import Image from "next/image";
import Anchor from "@ui/anchor";
import { ImageType } from "@utils/types";

const ClientAvatar = ({ slug, name, image, className }) => (
    <Anchor
        path={slug}
        className={clsx("avatar", className)}
        data-tooltip={name}
    >
        {image?.src && (
            <Image
                src={image.src}
                alt={image?.alt || name}
                width={image?.width || 30}
                height={image?.height || 30}
            />
        )}
    </Anchor>
);

ClientAvatar.propTypes = {
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: ImageType.isRequired,
    className: PropTypes.string,
};

export default ClientAvatar;
