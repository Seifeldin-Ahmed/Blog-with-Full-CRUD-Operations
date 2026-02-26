import {expect} from 'chai';
import User from '../models/user.js';
import feedController from '../controllers/feed.js';
import mongoose from  'mongoose';

describe('Feed Controller', function(){
    //before is a function provided by mocha like describe and it, and you can use this function only inside describe
    //and you pass to it a function that will be executed before mocha starts the testing operating of all the test cases,
    //so before will run once before all the test cases, not before every test case
    //here we don't wanna reconnect and recreate a user before every test, but initially when the test starts
    before(function(done){ 
        //important: choose another database for testing, don't choose the production database
        mongoose.connect('mongodb+srv://SeifAhmed:seif9517535@cluster0.agaemyt.mongodb.net/DBTesting?retryWrites=true&w=majority&appName=Cluster0')
        .then(() => {
            //we need an exisitng user, so add a user to the database first
            const user = new User({
                // if this._id is undefined or null, then mongodb will generate ObjectId and assign it to _id for us, otherwise if id has a value then mongodb will not generate an id an it will uses our value
                _id: '66c800c3b055d3ad6f5671f7', //a string considered to be a valid ID by mongoDB
                email: 'test@test.com',
                name: 'Test',
                password: 'Test'
            });
            return user.save();
        })
        .then(() => {
            done(); //when you call done here, mocha knows that you're done with your initialization and it will start running your test cases
        })
        .catch(err => console.log(err));
    });

    it('should add a created post to the posts of the creator', function(done){
        const req = {
            userId: '66c800c3b055d3ad6f5671f7',
            file: {path: 'abc'},
            body: {
                title: 'test post title',
                content: 'test post content'
            }
        };
        const res = {
            statusCode: 500,
            userStatus: null,
            status: function (code){ //a regular function not arrow function, because we want this here to ref on the object that will call this function
                return this; // to chain calls to make res.status().json so when executing res.status() the res object will be returned to make res.json()
            },
            json: function(data){}
        };
        feedController.createPost(req, res, () => {})
        .then(savedUser =>{
            expect(savedUser).to.have.property('posts');
            expect(savedUser.posts).to.have.length(1);
            done();
        })
        .catch(err => console.log(err));
    });

    //the position doesn't matter, you could define this function up there too
    //after will run after all your test cases
    after(function(done){
        User.deleteMany({}) //pass empty object which means: all object are deleted. if you have a test and you setup a dummy data, clear up everything after that test, so than you can be sure that you have a clean setup for the next test thereafter
        .then(() => {
            return mongoose.disconnect();
        })
        .then(() => {
            done();
        })
        .catch(err => console.log(err));
    });

});
