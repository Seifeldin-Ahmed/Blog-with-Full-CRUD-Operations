//const mongoose = require('mongoose');
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    name: {type: String, required: true},
    status: {type: String, default: 'I am new!'}, //this means that every user will start with this status here
    // each object in this array will just have an id
    posts: [{type: Schema.Types.ObjectId, required: true, ref: 'Post'}]
});

//module.exports = mongoose.model('User',userSchema);
export default mongoose.model('User',userSchema);