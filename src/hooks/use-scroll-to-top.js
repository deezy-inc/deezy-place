import { useState, useEffect } from "react";

function useScrollToTop() {
    const [stick, setStick] = useState(false);
    const onClickHandler = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        const scrollHandler = () => {
            const scrollPos = window.pageYOffset;
            if (scrollPos > 50) {
                setStick(true);
            } else {
                setStick(false);
            }
        };

        window.addEventListener("scroll", scrollHandler);
        return () => {
            window.removeEventListener("scroll", scrollHandler);
        };
    }, [stick]);

    return { stick, onClickHandler };
}

export default useScrollToTop;
