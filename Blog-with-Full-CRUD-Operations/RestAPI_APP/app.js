// const express = require('express');
// const path = require('path');
// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');
// const bodyParser = require('body-parser');
// const mongoose =  require('mongoose');
// const multer = require('multer');

import express from 'express';
import feedRoutes from './routes/feed.js';
import authRoutes from './routes/auth.js';
import bodyParser from 'body-parser';
import mongoose from  'mongoose';
import multer from 'multer';
import socketFile from './socket.js';

//In ES modules (when using import/export syntax), __dirname isn’t available by default.
//To get the current directory in an ES module, use this workaround instead:
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replaceAll(':', '-') + '_' + file.originalname); // unique filename
    }
});

const fileFilter = (req, file, cb) =>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const MONGODB_URL = 'mongodb+srv://SeifAhmed:seif9517535@cluster0.agaemyt.mongodb.net/restAPITest?retryWrites=true&w=majority&appName=Cluster0';

//bodyParser.urlencoded():  this great for requests that hold data of the format of application/x-www-form-urlencoded(this is the content-type) [this is the default data that data will have, if submitted through a form post request]
//bodyParser.json(): this is able to parse json data from incoming requests which has the format of application/json(this is the content-type)
app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images',express.static(path.join(__dirname,'images')));


// i can make app.options('*', func);
// * means match any path and i will work only for options request
app.use((req, res, next) => { //solve CORS Problem
    // wildcart(*) means: allow access from any client
    res.setHeader('Access-Control-Allow-Origin', '*'); //modify the response and add a new headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}); 

app.use('/feed',feedRoutes);
app.use('/auth',authRoutes);

app.use((error, req, res, next) => {
    console.log('hi')
    const status = error.statusCode || 500; //incase of statusCode undifned so it will take the value of 500 
    const message = error.message; // this property exist by default, and it holds the message you passed to the constructor of the error object
    const data = error.data;
    res.status(status).json({message: message, data: data});
});

mongoose.connect(MONGODB_URL)
.then(() => {
    const server = app.listen(8080);
    const io = socketFile.init(server);
    console.log("connected...");
    //now we can use io to define a couple of event listeners for example to wait for new connections, so whenever a new client connects to us
    //this function will be executed for every new client that connects
    io.on('connection', socket => { //socket paramter here: is the connection between our server and the client which connected
        console.log('Client connected');
    });
})
.catch(err => console.log(err));
