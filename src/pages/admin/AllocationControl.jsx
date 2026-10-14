
import React, { useState } from 'react';
import ConflictAlertBanner from '../../components/ConflictAlertBanner';

export default function AllocationControl() {
    const [conflict, setConflict] = useState(null);

    const simulateClash = () => {
        setConflict(
            conflict
                ? null
                : 'Dr. Amit Sharma is double-booked in Room 402 at 10:00 AM!'
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    className="btn-secondary"
                    onClick={simulateClash}
                >
                    ⚠️ Simulate Collision
                </button>

                <button
                    className="btn-primary"
                    onClick={() => setConflict(null)}
                >
                    ⚡ Run Auto-Allocation
                </button>
            </div>

            <ConflictAlertBanner
                message={conflict}
                onResolve={() => setConflict(null)}
            />
        </div>
    );
}
