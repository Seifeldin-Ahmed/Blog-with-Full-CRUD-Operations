// const {validationResult} = require('express-validator');
// const Post = require('../models/post');
// const path = require('path');
// const fs = require('fs');
// const User = require('../models/user');
// const io = require('../socket');
// const { error } = require('console');

import {validationResult} from 'express-validator';
import Post from '../models/post.js';
import fs from 'fs';
import User from '../models/user.js';
import io from '../socket.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPosts = async (req, res, next) =>{
    // no res.render here because restAPIs don't render views
    //json() is a method provided by express-js that allows us to return response with a json data with the right header being set    
    //clint now has to render the ui based on your response, so be clear about status code(important),
    //because especially error codes are super important to pass back to the client so that the client can just have a look 
    // at these status code and find out should i render my normal ui because requests succeeded
    //or did i get an error, and i want to render an appropriate error interface.
    //previously in the course we sent the whole interface so the cline didn't have to worry about that
    const currentPage = +req.query.page || 1;
    const perPage = 2;
    try{ 
        const totalItems = await Post.find().countDocuments();
        //sort elements in decending way: to let latest posts come first
        const posts = await Post.find().populate('creator').sort({createdAt: -1}).skip((currentPage - 1) * perPage).limit(perPage);
        res.status(200).json({
                message: 'Fetched posts successfully',
                posts: posts, //note: although creator here is a mongoose object with data + meta data, what will be sent is only the data of the object not the meta data also, so no need to make {...creatpr_doc}
                totalItems: totalItems
        });
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500 ; //server side error
        }
        next(err);
    }
};
// here in creatPost function, we want to use socket.io
// the existing connection we have set up to basically inform all connected clients about the new post
const createPost = async (req, res, next) =>{
    //200 -> success
    //201 -> success and resource created
    // this body field on the incoming request added by our body-parser
    const errors = validationResult(req);  
    if(!errors.isEmpty()){
        const error = new Error('Vaildation failed, entered data is incorrect.');
        error.statusCode = 422 //set my custome property
        throw error; // since we are in a sync code, so we will go exit the code here and go to error-handling middleware
    }
    if(!req.file){
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path.replaceAll('\\','/');
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({ // mongoose will add _id, createdAt, updatedAt fields
        title: title,
        imageUrl: imageUrl,
        content: content,
        creator: req.userId, // req.userId is a string here not ObjectId be mongoose will convert it
    });
    console.log("post is:  ");
    console.log(post);
    try{
        await post.save();
        const creator = await User.findById(req.userId);
        creator.posts.push(post); //mongoose will do all the heavy lifting of pulling out the postId and adding that to the user actually
        console.log("creator is:  ");
        console.log(creator);
        const savedUser = await creator.save();
        //first argument : evenName
        //second argument: object(data) i want to send
        //when you run the test, comment this line because you are testing only backend and the DB, so there's no server or connection or websocket or anything
       // io.getIO().emit('posts', {action: 'create', post: {...post._doc, creator: {_id: creator._id, name: creator.name}}});
        res.status(201).json({
            message: 'Post created successfully',
            post: post,//this is the post object i created up
            creator: {_id: creator._id, name: creator.name}
        });
        return savedUser;
    }
    catch(err) {
        if(!err.statusCode){
            err.statusCode = 500 ; //server side error
        }
        next(err);
    }
};

 const getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try{
        const post = await Post.findById(postId);
        if(!post){
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error; //we are in async code, so this throw will go to the catch block
        }
        res.status(200).json({
            message: 'Post fetched',
            post: post
        });
    }   
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

const updatedPost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Vaildation failed, entered data is incorrect.');
        error.statusCode = 422 //set my custome property
        throw error; // since we are in a sync code, so we will go exit the code here and go to error-handling middleware
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file){
        imageUrl = req.file.path.replaceAll('\\','/');
    }
    if(!imageUrl){
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    try{
        const post = await Post.findById(postId).populate('creator');
        if(!post){
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error; //we are in async code, so this throw will go to the catch block
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl,next);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl 
        const result = await post.save();
        io.getIO().emit('posts',{action: 'update', post: result})
        res.status(200).json({
            message: 'post Updated!',
            post: result
        });
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
}

const deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try{
        const post = await Post.findById(postId)
        if(!post){
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error; //we are in async code, so this throw will go to the catch block
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl, next);
        await Post.findByIdAndDelete(postId);
        const user = await User.findById(req.userId);
        //delete the relation in the user collection
        user.posts.pull(postId); //pull method that mongoose gives me, I need to pass to it the postId i want to remove
        await user.save();

        io.getIO().emit('posts', {action: 'delete', post: postId});
        
        res.status(200).json({message: 'post Deleted'});
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

const clearImage = (filePath, next) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, (err) =>{ 
        if(err){
            next (err);
        }
    });
};

export default {
    getPosts,
    createPost,
    getPost,
    updatedPost,
    deletePost,
};