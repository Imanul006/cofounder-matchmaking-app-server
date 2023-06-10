const mongoose = require('mongoose')
const helpers = require('../utils/helpers.js')
const Schema = mongoose.Schema;

const ConnectionSchema = new Schema({
    connected_with: String,
    i_am_sender: { type: Boolean, required: true },
    }, {
    timestamps: true
})    

module.exports = mongoose.model("Connection", ConnectionSchema)