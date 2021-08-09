const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
    },
    date: {
        type: String
    }

});

module.exports = mongoose.model('Note', noteSchema)