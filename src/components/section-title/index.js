import PropTypes from "prop-types";
import clsx from "clsx";
import { TailSpin } from "react-loading-icons";

const SectionTitle = ({ title, className, disableAnimation, isLoading, ...restProps }) => (
    <div className="section-title">
        <h3
            className={clsx(className)}
            // data-sal-delay="100"
            // data-sal={!disableAnimation && "slide-up"}
            // data-sal-duration="400"
            {...restProps}
            dangerouslySetInnerHTML={{ __html: title }}
        />
        {isLoading && <TailSpin stroke="#fec823" speed={0.75} />}
    </div>
);

SectionTitle.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    className: PropTypes.string,
    disableAnimation: PropTypes.bool,
    isLoading: PropTypes.bool,
};

export default SectionTitle;
