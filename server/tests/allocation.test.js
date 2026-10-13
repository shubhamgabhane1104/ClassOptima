
const { checkClash } = require('../services/conflictDetector');

const result = checkClash({
    teacher: 'Dr. Sharma',
    room: 'Room 402',
    day: 'MONDAY',
    slotIndex: 1,
    existingSlots: [
        {
            teacherName: 'Dr. Sharma',
            roomNumber: 'Room 401',
            day: 'MONDAY',
            slotIndex: 1
        }
    ]
});

console.assert(
    result.valid === false,
    'Collision test passed'
);
