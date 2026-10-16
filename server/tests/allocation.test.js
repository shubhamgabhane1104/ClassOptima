const assert = require('node:assert/strict');
const { checkClash } = require('../services/conflictDetector');

const existingSlots = [
  {
    teacherName: 'Dr. Sharma',
    roomNumber: 'Room 401',
    day: 'MONDAY',
    slotIndex: 1
  }
];

const tests = [
  {
    name: 'Teacher clash is detected',
    input: {
      teacher: 'Dr. Sharma',
      room: 'Room 402',
      day: 'MONDAY',
      slotIndex: 1,
      existingSlots
    },
    expectedValid: false
  },
  {
    name: 'Room clash is detected',
    input: {
      teacher: 'Prof. Patil',
      room: 'Room 401',
      day: 'MONDAY',
      slotIndex: 1,
      existingSlots
    },
    expectedValid: false
  },
  {
    name: 'Different slot has no clash',
    input: {
      teacher: 'Dr. Sharma',
      room: 'Room 401',
      day: 'MONDAY',
      slotIndex: 2,
      existingSlots
    },
    expectedValid: true
  }
];

let failures = 0;

for (const test of tests) {
  try {
    const result = checkClash(test.input);

    assert.equal(result.valid, test.expectedValid);
    console.log(`PASS: ${test.name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL: ${test.name} - ${error.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${tests.length} tests passed.`);
}
