const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResumeSchema = new Schema({
  bio: String,
  category: String,
  expertise: String,
  startup_count: Number,
  skills: String,
  has_startup: Boolean,
});

module.exports = mongoose.model("Resume", ResumeSchema);
