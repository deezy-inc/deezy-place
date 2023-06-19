import Countdown, { zeroPad } from "react-countdown";
import PropTypes from "prop-types";
import clsx from "clsx";

// TODO: Callback on complete, to remove item from live biddin
const CountdownTimerText = ({ time, className }) => {
    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) return null;
        return (
            <div className="countdown-text-small">
                {Boolean(days) && <span>{days} days</span>}
                {Boolean(hours) && <span>{hours} hours</span>}
                {Boolean(minutes) && <span>{minutes} minutes</span>}
                {Boolean(seconds) && <span>{seconds} seconds</span>}
            </div>
        );
    };
    return <Countdown date={new Date(time)} renderer={renderer} />;
};

CountdownTimerText.propTypes = {
    time: PropTypes.number.isRequired,
    className: PropTypes.string,
};

export default CountdownTimerText;
