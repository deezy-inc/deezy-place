import { useEffect } from "react";
import clsx from "clsx";
import { useScrollToTop } from "@hooks";

const ScrollToTop = () => {
    const { stick, onClickHandler } = useScrollToTop();

    useEffect(() => {
        const progressPath = document.querySelector(".rn-progress-parent path");
        const pathLength = progressPath.getTotalLength();
        progressPath.style.transition = progressPath.style.WebkitTransition =
            "none";
        progressPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
        progressPath.style.strokeDashoffset = pathLength;
        progressPath.getBoundingClientRect();
        progressPath.style.transition = progressPath.style.WebkitTransition =
            "stroke-dashoffset 10ms linear";
        const updateProgress = () => {
            const scroll = window.scrollY;
            const docHeight = document.body.offsetHeight;
            const winHeight = window.innerHeight;
            const height = docHeight - winHeight;
            const progress = pathLength - (scroll * pathLength) / height;
            progressPath.style.strokeDashoffset = progress;
        };
        updateProgress();
        window.addEventListener("scroll", updateProgress);
    });

    return (
        <div
            className={clsx(
                "rn-progress-parent",
                stick && "rn-backto-top-active"
            )}
            role="button"
            onClick={onClickHandler}
            onKeyUp={(e) => e}
            tabIndex={-1}
        >
            <svg
                className="rn-back-circle svg-inner"
                width="100%"
                height="100%"
                viewBox="-1 -1 102 102"
            >
                <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" />
            </svg>
        </div>
    );
};

export default ScrollToTop;
