import { useEffect, useState } from "react";
import { useInterval } from "react-use";
import { isSpent as isInscriptionSpent } from "@services/nosft";

const delay = 3000;

function useIsSpent(output) {
    const [currentOutput, setCurrentOutput] = useState(output);
    const [isSpent, setIsSpent] = useState(true);
    const [isPooling, setIsPooling] = useState(true);

    const fetchIsSpent = async () => {
        if (!currentOutput) return;
        const result = await isInscriptionSpent({
            output: currentOutput,
        });
        setIsSpent(result.spent);
        setIsPooling(!result.spent);
    };

    useInterval(
        async () => {
            await fetchIsSpent();
        },
        isPooling && currentOutput ? delay : null
    );

    useEffect(() => {
        if (!output) return;
        setCurrentOutput(output);
        setIsPooling(true);
    }, [output]);

    return { isSpent, isPooling, setIsPooling };
}

export default useIsSpent;
