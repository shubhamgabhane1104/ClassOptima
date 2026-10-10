const mongoose = require('mongoose');
const classSectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, required: true },
  semester: { type: Number, required: true },
  studentCount: { type: Number, required: true }
});
module.exports = mongoose.model('ClassSection', classSectionSchema);