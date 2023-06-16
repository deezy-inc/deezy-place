import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

const AnimatedText = ({ text, className }) => {
    const characters = text.split("");

    return (
        <span className={className}>
            {characters.map((char, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <AnimatePresence key={`${char}-${index}`}>
                    <motion.span
                        initial={{ y: 10, x: 10, filter: "blur(15px)", opacity: 0 }}
                        animate={{ y: 0, x: 0, filter: "blur(0px)", opacity: 1 }}
                        exit={{ y: 10, x: 10, filter: "blur(15px)", opacity: 0 }}
                        transition={{ ease: "easeInOut", duration: 0.4, delay: index * 0.08 }}
                        className="text-animation"
                    >
                        {char}
                    </motion.span>
                </AnimatePresence>
            ))}
        </span>
    );
};

AnimatedText.propTypes = {
    text: PropTypes.string,
    className: PropTypes.string,
};

export default AnimatedText;
