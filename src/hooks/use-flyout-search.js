import { useState } from "react";

function useFlyoutSearch() {
    const [search, setSearch] = useState(false);

    const searchHandler = () => {
        setSearch((prev) => !prev);
    };

    return { search, searchHandler };
}

export default useFlyoutSearch;
