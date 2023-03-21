import dynamic from "next/dynamic";
import PropTypes from "prop-types";
import clsx from "clsx";

const SlickSlider = dynamic(() => import("react-slick"), {
    ssr: false,
});

const Slider = ({ options, children, className }) => {
    const settings = {
        dots: false,
        arrows: false,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        adaptiveHeight: true,
        cssEase: "linear",

        ...options,
    };

    return (
        <SlickSlider className={clsx(className)} {...settings}>
            {children}
        </SlickSlider>
    );
};

Slider.propTypes = {
    options: PropTypes.shape({
        dots: PropTypes.bool,
        infinite: PropTypes.bool,
        speed: PropTypes.number,
        slidesToShow: PropTypes.number,
        slidesToScroll: PropTypes.number,
        autoplay: PropTypes.bool,
        breakpoints: PropTypes.shape({}),
    }),
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Slider;

export const SliderItem = ({ children, className, ...rest }) => (
    <div className={clsx(className, "slider-item")} {...rest}>
        {children}
    </div>
);

SliderItem.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
