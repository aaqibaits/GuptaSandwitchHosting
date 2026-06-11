// components/Toast.js
import React from 'react';
import './Toast.css';

const Toast = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast show">
      {message}
    </div>
  );
};

export default Toast;