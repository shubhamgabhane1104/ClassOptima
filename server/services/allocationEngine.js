
const { checkClash } = require('./conflictDetector');

const DAYS = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY'
];

const SLOTS = [1, 2, 3, 4, 5, 6];

exports.solveTimetable = (lecturePool, rooms) => {
    const allocated = [];

    function solve(index) {
        if (index >= lecturePool.length) {
            return true;
        }

        const lecture = lecturePool[index];

        for (const day of DAYS) {
            for (const slotIndex of SLOTS) {
                for (const room of rooms) {
                    const check = checkClash({
                        teacher: lecture.teacher,
                        room: room.roomNumber,
                        day,
                        slotIndex,
                        existingSlots: allocated
                    });

                    if (check.valid) {
                        allocated.push({
                            ...lecture,
                            roomNumber: room.roomNumber,
                            day,
                            slotIndex
                        });

                        if (solve(index + 1)) {
                            return true;
                        }

                        allocated.pop();
                    }
                }
            }
        }

        return false;
    }

    const success = solve(0);

    return { success, allocated };
};
