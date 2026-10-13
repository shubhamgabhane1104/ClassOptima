
import React from 'react';
import '../styles/conflict.css';

export default function ConflictAlertBanner({ message, onResolve }) {
    if (!message) {
        return null;
    }

    return (
        <div className="conflict-banner" role="alert">
            <span aria-hidden="true">⚠️</span>
            <strong> Scheduling Conflict: </strong>
            <span>{message}</span>

            {onResolve && (
                <button
                    type="button"
                    className="conflict-resolve-btn"
                    onClick={onResolve}
                >
                    Resolve
                </button>
            )}
        </div>
    );
}
