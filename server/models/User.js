const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'professor', 'student'],
      default: 'student',
      required: true
    },
    profileRefId: { type: mongoose.Schema.Types.ObjectId, refPath: 'profileModel' },
    profileModel: { type: String, enum: ['Teacher', 'ClassSection'] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
