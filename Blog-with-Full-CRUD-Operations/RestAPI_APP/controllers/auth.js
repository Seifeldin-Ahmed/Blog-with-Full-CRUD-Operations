// const User = require('../models/user');
// const {validationResult} = require('express-validator');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
import User from '../models/user.js';
import {validationResult} from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array(); //keep errors to send it back to the frontend
        console.log(error.data);
        //you can't make throw error here because this is async function, and always there's a rule:
        //in any async code (async function, catch block of proimse, callback) throwing error will not make express-js to go to err handling middleware
        //you have to use next(error);
        next(error); 
        return;
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    
    try{
        const hashedPassword = await bcrypt.hash(password,12)
        const user = new User({name: name, email:email, password: hashedPassword});
        const result = await user.save();
        res.status(201).json({message: 'User created!', userId: result._id});
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500 ; //server side error
        }
        next(err);
    }
};

const login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    try{
        const user = await User.findOne({email: email})
        if(!user){
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401; // not authenticated
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);    
        if(!isEqual){
            const error = new Error('Wrong password!');
            error.statusCode = 401; // not authenticated
            throw error;
        }
        //generate a JSON Web Token
        /*
         * first argument:  we can add any data we want into the token, like for example we could store the user email and user id, but don't pass the password because it will send back to the client
         *  second argument: secret (private key) which is used for signing and that is only known to the server, and therefore you can't fake that token on the client      
         *                   it should be any longer string
         *  third argument:  configuration object where i will set the expiry time.
         *                   expiry time for example 1hour so the token will be invalid after 1 hour, this is a security mechanism you should add because the token stored at client to whom it belongs
         *                   but technically that token could be stolen. if the user does not logout, another person copies the token from his browser storage and then he can use it on his own pc forever
         *                   Well not forever now at least because after one hour, the token becomes invalid 
         *                   so this is a nice in between solution, between usability and security
         */
        const token = jwt.sign({email: user.email, userId: user._id.toString()}, 'somesupersecretsecret', {expiresIn: '1h'}); //this creates a new signautre and packs that into a new json web token
        res.status(200).json({token: token, userId: user._id.toString()}); // that data needs to be provided because the react app will be looking for that ID and will store it and it will logout that user after 1 hour
        return; //this will implicitly return the promise we have hidden behing asynnc await in here
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500 ; //server side error
        }
        next(err);
        return err; //return promise with the err
    }
};

const getUserStatus = async (req, res, next) =>{
    try{
        const user = await User.findById(req.userId);
        if(!user){
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({status: user.status});
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500 ; //server side error
        }
        next(err);
    }
};

const updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status; //this is the field that frontend will send
    try{
        const user = await User.findById(req.userId)
        if(!user){
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        await user.save();
        res.status(200).json({message: 'User updated.'});
    }
    catch(err) {
        if(!err.statusCode){
            err.statusCode = 500 ; //server side error
        }
        next(err);
    }
}


export default {
    signup,
    login,
    getUserStatus,
    updateUserStatus
};