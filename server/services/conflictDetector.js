exports.checkClash = ({
    teacher,
    room,
    day,
    slotIndex,
    existingSlots
}) => {

    // Check for teacher clash
    const teacherClash = existingSlots.find(
        (slot) =>
            slot.day === day &&
            slot.slotIndex === slotIndex &&
            slot.teacherName === teacher
    );

    if (teacherClash) {
        return {
            valid: false,
            error: `${teacher} is already booked at this day and time!`
        };
    }

    // Check for room clash
    const roomClash = existingSlots.find(
        (slot) =>
            slot.day === day &&
            slot.slotIndex === slotIndex &&
            slot.roomNumber === room
    );

    if (roomClash) {
        return {
            valid: false,
            error: `Room ${room} is already booked at this day and time!`
        };
    }

    // No conflict
    return {
        valid: true
    };
};