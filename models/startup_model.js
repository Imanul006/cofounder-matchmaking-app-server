const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const StartupSchema = new Schema({
    name: String,
    legal_name: String,
    tagline: String,
    industry: String,
    date_founded: Date,
    kv_incubation_id: String,
})

module.exports = mongoose.model("Startup", StartupSchema)