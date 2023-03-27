import Anchor from "@ui/anchor";

const QuicklinkWidget = ({ data }) => (
    <div className="footer-widget widget-quicklink">
        <h6 className="widget-title">{data.title}</h6>
        {data?.menu && (
            <ul className="footer-list-one">
                {data.menu.map((nav) => (
                    <li key={nav.id} className="single-list">
                        <Anchor path={nav.path}>{nav.text}</Anchor>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

interface QuicklinkWidgetProps {
    data: {
        title: string;
        menu: {
            id: number | string;
            text: string;
            path: string;
        }[];
    };
}

export default QuicklinkWidget;
