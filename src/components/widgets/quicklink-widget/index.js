import PropTypes from "prop-types";
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

QuicklinkWidget.propTypes = {
    data: PropTypes.shape({
        title: PropTypes.string,
        menu: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
                    .isRequired,
                text: PropTypes.string.isRequired,
                path: PropTypes.string.isRequired,
            })
        ),
    }),
};

export default QuicklinkWidget;
