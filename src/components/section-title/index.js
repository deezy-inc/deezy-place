import PropTypes from "prop-types";
import clsx from "clsx";

const SectionTitle = ({ title, className, disableAnimation, counter, ...restProps }) => (
    <div className="section-title">
        <h3
            className={clsx(className)}
            // data-sal-delay="100"
            // data-sal={!disableAnimation && "slide-up"}
            // data-sal-duration="400"
            {...restProps}
            dangerouslySetInnerHTML={{ __html: title }}
        />
        <span className="ordinals-counter">{counter}</span>
    </div>
);

SectionTitle.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    className: PropTypes.string,
    disableAnimation: PropTypes.bool,
    counter: PropTypes.string,
};

export default SectionTitle;
