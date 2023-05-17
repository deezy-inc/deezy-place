import Countdown, { zeroPad } from "react-countdown";
import PropTypes from "prop-types";

// TODO: Callback on complete, to remove item from live biddin
const CountdownTimerText = ({ date }) => {
    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) return <div>Completed</div>;
        return (
            <span>
                <span>{Boolean(days) && <span>{days} days</span>}</span>{" "}
                <span>{Boolean(hours) && <span>{hours} hours</span>}</span>{" "}
                <span>{Boolean(minutes) && <span>{minutes} minutes</span>}</span>{" "}
                <span>{Boolean(seconds) && <span>{seconds} seconds</span>}</span>
            </span>
        );
    };
    return <Countdown date={new Date(date)} renderer={renderer} />;
};

CountdownTimerText.propTypes = {
    date: PropTypes.string.isRequired,
};

export default CountdownTimerText;
