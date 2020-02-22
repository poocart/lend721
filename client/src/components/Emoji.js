import React from 'react';
import PropTypes from 'prop-types';


const Emoji = ({ content, size }) => (
  <span
    style={size && { fontSize: size }}
    role="img"
    aria-label="emoji"
  >
    {content}
  </span>
);

Emoji.propTypes = {
  content: PropTypes.string.isRequired,
  size: PropTypes.number,
};

export default Emoji;
