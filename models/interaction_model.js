const mongoose = require('mongoose')
const helpers = require('../utils/helpers.js')
const Schema = mongoose.Schema;

const InteractionSchema = new Schema({
    interaction_type: {
        type: String,
        enum: helpers.interaction_choices,
        default: helpers.interaction_choices.liked
    },
    interacted_with: { type: String, required: true },
    }, {
    timestamps: true
})    

module.exports = mongoose.model("Interaction", InteractionSchema)