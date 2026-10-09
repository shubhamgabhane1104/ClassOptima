
const { solveTimetable } = require('../services/allocationEngine');

exports.generateSchedule = async (req, res) => {
    const samplePool = [
        {
            subjectName: 'Database Systems',
            teacher: 'Dr. Amit Sharma',
            type: 'theory'
        },
        {
            subjectName: 'Operating Systems',
            teacher: 'Prof. Vikas Patil',
            type: 'theory'
        }
    ];

    const sampleRooms = [
        { roomNumber: 'Room 402' },
        { roomNumber: 'Lab 3' }
    ];

    const result = solveTimetable(samplePool, sampleRooms);

    res.json({
        success: result.success,
        count: result.allocated.length,
        data: result.allocated
    });
};
