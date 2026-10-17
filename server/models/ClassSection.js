const mongoose = require('mongoose');

// Which teacher teaches which subject to this division.
const courseAssignmentSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { _id: false }
);

const classSectionSchema = new mongoose.Schema(
  {
    // e.g. "B.Tech CSE"
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    // e.g. "A"
    section: { type: String, required: true, trim: true, uppercase: true },
    studentCount: { type: Number, required: true, min: 1 },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    courses: [courseAssignmentSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

classSectionSchema.index({ department: 1, semester: 1, section: 1 }, { unique: true });

classSectionSchema.virtual('label').get(function label() {
  return `${this.name} Sem ${this.semester} - Div ${this.section}`;
});

module.exports = mongoose.model('ClassSection', classSectionSchema);
