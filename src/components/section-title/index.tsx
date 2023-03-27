import clsx from "clsx";
import { TailSpin } from "react-loading-icons";

const SectionTitle = ({ title, className, isLoading, ...restProps }: SectionTitleProps) => (
    <div className="section-title">
        <h3
            className={clsx(className)}
            {...restProps}
            dangerouslySetInnerHTML={{ __html: title }}
        />
        {isLoading && <TailSpin stroke="#fec823" speed={0.75} />}
    </div>
);

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    className: string;
    isLoading: boolean;
};

export default SectionTitle;
