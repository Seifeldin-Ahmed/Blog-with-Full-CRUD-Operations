// const express = require('express');
// const {body} = require('express-validator');
// const router = express.Router();
// const User = require('../models/user');
// const authController = require('../controllers/auth');
// const isAuth = require('../middleware/is_auth');
import express from 'express';
import {body} from 'express-validator';
const router = express.Router();
import User from '../models/user.js';
import authController from '../controllers/auth.js';
import isAuth from '../middleware/is_auth.js';

// whether it's new or we overwrite existing data, that's why we used put not post
router.put('/signup',
    body('email').isEmail().withMessage('Plase enter a vaild email.').custom((value, { req }) => {
        return User.findOne({email: value})
               .then(userDoc => {
                    if(userDoc){
                        return Promise.reject('E-mail address already exists!');
                    }
               });
    }).normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('name').trim().not().isEmpty(), //this means it shouldn't  be empty
    authController.signup
);
router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus);

// or you may use put method also
router.patch('/status',
    isAuth,
    body('status').trim().not().isEmpty(),
    authController.updateUserStatus
);

export default router;