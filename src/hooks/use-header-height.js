import { useState, useEffect } from "react";

const useHeaderHeight = (ref, initialHeight = 148) => {
    const [headerHeight, setHeaderHeight] = useState(initialHeight);

    useEffect(() => {
        if (ref.current) {
            setHeaderHeight(ref.current.clientHeight);
        }
    }, [ref]);

    return headerHeight;
};

export default useHeaderHeight;
