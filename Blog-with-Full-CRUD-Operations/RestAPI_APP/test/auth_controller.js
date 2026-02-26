import {expect} from 'chai';
import sinon from 'sinon';
import User from '../models/user.js';
import AuthController from '../controllers/auth.js';
import mongoose from  'mongoose';

describe('Auth Controller', function(){
    //before is a function provided by mocha like describe and it, and you can use this function only inside describe
    //and you pass to it a function that will be executed before mocha starts the testing operating of all the test cases,
    //so before will run once before all the test cases, not before every test case
    //here we don't wanna reconnect and recreate a user before every test, but initially when the test starts
    before(function(done){ 
        //important: choose another database for testing, don't choose the production database
        mongoose.connect('mongodb+srv://SeifAhmed:seif9517535@cluster0.agaemyt.mongodb.net/DBTesting?retryWrites=true&w=majority&appName=Cluster0')
        .then(() => {
            //we need an exisitng user, so add a user to the database first
            // if this._id is undefined or null, then mongodb will generate ObjectId and assign it to _id for us, otherwise if id has a value then mongodb will not generate an id an it will uses our value
            const user = new User({
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

    //1) the first way of handling the database using stup
    it('should throw an error with Code 500 if accessing the database fails', function(done){
        sinon.stub(User, 'findOne');
        User.findOne.throws(); // force findOne function to throw an error;
        
        const req = {
            body: {
                email: 'test@test.com',
                password: 'test'
            }
        };
        AuthController.login(req, {}, () => {})
        .then(result => {
            expect(result).to.be.an('error');
            expect(result).to.have.property('statusCode', 500);
            done();
        });

        User.findOne.restore();
    });

    //2) the second way of handling the database using a real access scenairo (but always use another database for testing, no the orginialOne, so here i choose DBTesting as another database)
    it('Should send a response with a valid user status for an exisitng user', function(done){
        const req = {userId: '66c800c3b055d3ad6f5671f7'};
        const res = {
            statusCode: 500,
            userStatus: null,
            status: function (code){ //a regular function not arrow function, because we want this here to ref on the object that will call this function
                this.statusCode = code;
                return this; // to chain calls to make res.status().json so when executing res.status() the res object will be returned to make res.json()
            },
            json: function(data){
                this.userStatus = data.status;
            }
        };
        AuthController.getUserStatus(req, res, () => {}) 
        .then(() => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.userStatus).to.be.equal('I am new!');
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

/*
    NOTES: 

        1) after() and before(): these methods we call them HOOKS.
        
        2) you could have multiple describe blocks
           if you need different hooks for different test cases
           which means you if you have some testcases that need another setup
           make a describe function for them, to group them together.

        3) HOOKS is better than the old solution because it makes the code more organaized
           and also it prevent us from repeating the code if we need same setup for multiple test cases.

        4) besides before() and after() there's also
           beforeEach() and afterEach()
           beforeEach() is an initialization that runs before each test case
           afterEach() is a finalization that rubs after each test case
*/

/******************* OLD SOLUTION *******************/
/*
describe('Auth Controller - Login', function(){
    //2) the second way of handling the database using a real access scenairo (but always use another database for testing, no the orginialOne, so here i choose DBTesting as another database)
    it('Should send a response with a valid user status for an exisitng user', function(done){
        //important: choose another database for testing, don't choose the production database
        mongoose.connect('mongodb+srv://SeifAhmed:seif9517535@cluster0.agaemyt.mongodb.net/DBTesting?retryWrites=true&w=majority&appName=Cluster0')
        .then(() => {
            //we need an exisitng user, so add a user to the database first
            const user = new User({
                _id: '66c800c3b055d3ad6f5671f7', //a string considered to be a valid ID by mongoDB
                email: 'test@test.com',
                name: 'Test',
                password: 'Test'
            });
            return user.save();
        })
        .then(user => {
            const req = {userId: user._id};
            const res = {
                statusCode: 500,
                userStatus: null,
                status: function (code){ //a regular function not arrow function, because we want this here to ref on the object that will call this function
                    this.statusCode = code;
                    return this; // to chain calls to make res.status().json so when executing res.status() the res object will be returned to make res.json()
                },
                json: function(data){
                    this.userStatus = data.status;
                }
            };
            AuthController.getUserStatus(req, res, () => {}) 
            .then(() => {
                expect(res.statusCode).to.be.equal(200);
                expect(res.userStatus).to.be.equal('I am new!');
                User.deleteMany({}) //pass empty object which means: all object are deleted. if you have a test and you setup a dummy data, clear up everything after that test, so than you can be sure that you have a clean setup for the next test thereafter
                .then(() => {
                    return mongoose.disconnect();
                })
                .then(() => {
                    done();
                })
            }) 
        })
        .catch(err => console.log(err));
    });

});
*/