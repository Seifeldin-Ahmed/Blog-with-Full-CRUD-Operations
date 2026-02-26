//const mongoose = require('mongoose');
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {type: String, required: true},
    imageUrl: {type:String, required: true},
    content: {type: String, required: true},
    creator: {type: Schema.Types.ObjectId, required: true, ref:'User'}
}, {timestamps: true});// mongoose will add timestamp automatically when a new object is added to the db
                       // so we automatically get a createdAt and updatedAt timestamp out of the box

// we don't export the schema, but a model based on the schema
//module.exports = mongoose.model('Post', postSchema);
export default mongoose.model('Post',postSchema);