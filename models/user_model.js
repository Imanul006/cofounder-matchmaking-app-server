const mongoose = require('mongoose')
const interactions = require('./interaction_model').schema
const connections = require('./connection_model').schema
const resume = require('./resume_model').schema
const startup = require('./startup_model').schema
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: String,
    phone: { type: String, unique: true, required: true },
    email: String,
    dob: Date,
    profile_pic: String,
    state: String,
    city: String,
    startup: startup,
    resume: resume,
    interactions: [interactions],
    connections: [connections] 
})

module.exports = mongoose.model("User", UserSchema)
