import Countdown, { zeroPad } from "react-countdown";
import PropTypes from "prop-types";

// TODO: Callback on complete, to remove item from live biddin
const CountdownTimer = ({ date }) => {
    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) return <div>Completed</div>;
        return (
            <div className="countdown">
                <div className="countdown-container days">
                    <span className="countdown-value">{days}</span>
                    <span className="countdown-heading">Days</span>
                </div>
                <div className="countdown-container hours">
                    <span className="countdown-value">{zeroPad(hours)}</span>
                    <span className="countdown-heading">Hours</span>
                </div>
                <div className="countdown-container minutes">
                    <span className="countdown-value">{zeroPad(minutes)}</span>
                    <span className="countdown-heading">Minutes</span>
                </div>
                <div className="countdown-container seconds">
                    <span className="countdown-value">{zeroPad(seconds)}</span>
                    <span className="countdown-heading">Seconds</span>
                </div>
            </div>
        );
    };
    return <Countdown date={new Date(date)} renderer={renderer} />;
};

CountdownTimer.propTypes = {
    date: PropTypes.string.isRequired,
};

export default CountdownTimer;
