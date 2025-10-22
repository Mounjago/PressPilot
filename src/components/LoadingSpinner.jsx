import React from 'react';
import '../styles/Loading.css';

const LoadingSpinner = ({ size = 'medium', message = 'Chargement...' }) => {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export const LoadingSkeleton = ({ lines = 3, height = '20px' }) => {
  return (
    <div className="skeleton-container">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{
            height,
            width: index === lines - 1 ? '60%' : '100%'
          }}
        ></div>
      ))}
    </div>
  );
};

export const LoadingButton = ({ loading, children, ...props }) => {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="loading-button-content">
          <LoadingSpinner size="small" message="" />
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingSpinner;