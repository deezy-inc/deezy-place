import { useState } from "react";

function useOffcanvas() {
    const [offcanvas, setOffcanvas] = useState(false);

    const offcanvasHandler = () => {
        setOffcanvas((prev) => !prev);
    };

    return { offcanvas, offcanvasHandler, setOffcanvas };
}

export default useOffcanvas;
