const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Don't need to add _id field, MongoDB does that automatically
const PostSchema = new Schema({
    Image: {
        type: String,
        required: true
    },
    AuthorID: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    Title: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        default: ''
    },
    Likes: {
        type: Number,
        default: 0
    },
    IsPublic: {
        type: Boolean,
        default: true
    }
});

module.exports = Post = mongoose.model('Posts', PostSchema);