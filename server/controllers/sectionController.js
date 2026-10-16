const ClassSection = require('../models/ClassSection');

exports.getSections = async (req, res) => {
  try {
    const sections = await ClassSection.find();
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSection = async (req, res) => {
  try {
    const section = await ClassSection.create(req.body);
    res.status(201).json({ success: true, data: section });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};