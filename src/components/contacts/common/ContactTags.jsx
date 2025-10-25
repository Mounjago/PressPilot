/**
 * CONTACT TAGS COMPONENT
 * Displays contact tags in a styled format
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ContactTags.css';

const ContactTags = ({ tags, maxVisible = 3, onTagClick = null }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className="contact-tags">
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className={`contact-tag ${onTagClick ? 'clickable' : ''}`}
          onClick={() => onTagClick && onTagClick(tag)}
          title={tag}
        >
          {tag}
        </span>
      ))}

      {hiddenCount > 0 && (
        <span className="contact-tag contact-tag-more" title={`+${hiddenCount} autres tags`}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

ContactTags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string),
  maxVisible: PropTypes.number,
  onTagClick: PropTypes.func
};

export default ContactTags;