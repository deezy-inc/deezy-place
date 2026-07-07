import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";

// Badges for an output's non-common sat rarities, e.g. "Uncommon".
// Mirrors RuneDisplay so cards show both kinds of specialness consistently.
const RareSatsDisplay = ({ rareSats }) => {
  if (!rareSats || rareSats.length === 0) {
    return null;
  }

  const formatRarity = (rarity) =>
    rarity.charAt(0).toUpperCase() + rarity.slice(1);

  return (
    <div className="rare-sats-display">
      {rareSats.map((rarity) => (
        <Badge
          key={rarity}
          bg="info"
          text="dark"
          className="rare-sat-badge me-1 mb-2"
          style={{ fontSize: "0.8rem", padding: "4px 8px" }}
        >
          <span className="me-1" aria-hidden="true">
            ✦
          </span>
          {formatRarity(rarity)}
        </Badge>
      ))}
    </div>
  );
};

RareSatsDisplay.propTypes = {
  rareSats: PropTypes.arrayOf(PropTypes.string),
};

export default RareSatsDisplay;
