import {expect} from 'chai';
import authMiddleware from '../middleware/is_auth.js';
import jwt from 'jsonwebtoken';
import sinon from 'sinon';

//describe function makes you group your tests to know that those tests from Auth middleware file not from the controller for example, this is just for readability
//and you nest as many describe function calls as you want, so you can have multiple describe function calls inside of each other
describe("Auth Middleware", function() {
 
    // I want to force my code into certian scenarios like what if i didn't get an authorization header
    it('should throw an error if no authorization header is present', function(){
        const req = {
            get: function(headerName){ //no matter what this method done in reality, it's just a simulation for express function to return null
                return null; //simulating that it didn't get a value for req.get('Authorization');
            }
        };
        //we're not testing anything related to the response object, so we pass a dummy object, and also the authMiddleware will not use it in this scenario
        //the same for the next function (dummy function), it's not important here anyway
        //here we are not calling the authMiddleware by ourselves, instead we let mocha call it for us to handle the error thrown by authmiddleware, and we use bind to pass the argument that should be passed to authMiddleware
        expect(authMiddleware.bind(this, req, {}, ()=>{})).to.throw('Not authenticated.');
    });  

    it('should throw an error if the authorization header is only one string', function(){ 
        const req = {
            get: function(headerName){ //no matter what this method done in reality, it's just a simulation for express function
                return "xyz"; //simulating that a value for req.get('Authorization') was just the token like "xyz" instead of "bearer xyz";
            }
        };
        expect(authMiddleware.bind(this, req, {}, ()=>{})).to.throw(); //if you want to check an error would happen or not, don't pass any arguments like this
    });

    it('should throw an error if the token cannot be verified', function(){
        const req = {
            get: function(headerName){ //no matter what this method done in reality, it's just a simulation for express function
                return "Bearer xyz"; //simulating that a value for req.get('Authorization') was a not a valid token
            }
        };
        expect(authMiddleware.bind(this, req, {}, ()=>{})).to.throw(); //if you want to check an error would happen or not, don't pass any arguments like this
    });

    it('should yield a userId after decoding the token', function(){
        const req = {
            get: function(headerName){ //no matter what this method done in reality, it's just a simulation for express function
                return "Bearer xyz"; //simulating that a value for req.get('Authorization') was a valid token
            }
        };
        //first argument: pass the object where i have the method i wanna replace
        //second argument: pass the method name as a string\
        //sinon by default will replace that method with an empty function that doesn't do anything
        sinon.stub(jwt, 'verify');
        //verify here is something like an object that can be executed and also can be configured using returns() to configure what this function should return
        //returns() method is added by sinon
        //now when we call jwt.verify in authMiddleware it will call that stup
        jwt.verify.returns({userId: 'abc'});
        /*======================================= OLD IMPLEMENTATION (NOT RECOMMENDED) =============================================
        //what we are doing here is we're overwriting the actual verify method that this package(jsonwebtoken) has
        //We're overwriting it and the way module imports work in Nodejs if we overwrite it here, this will be the case in the middleware when it runs too, because we have one global package so to say
        //so we replaced the verify method with our implementation
            jwt.verify = function(){
                return {  userId: 'abc'};
            }
        ============================================================================================================================ */
        authMiddleware(req, {}, () => {}); // call the function by ourselves to see if the request object will have a new property called userId or not.
        expect(req).to.have.property('userId'); //if you want to check an error would happen or not, don't pass any arguments like this
        expect(jwt.verify.called).to.be.true; //check if this function is called
        jwt.verify.restore(); //this will restore the original function (that's the big difference between this and OLD IMPLEMENTATION)
    });

});

/*
    Notes:
    
        1) you shouldn't test whether the verify function of jwt.verify works correctly or not because this function not owned by you, it's not your job.
           so you shouldn't test whether it is really fails for incorrect tokens that were not created with that secret and also you should not test whether this really verifies a token correctly

        2) we only want to test if our code behaves correctly when verification fails, for example or when it succeeds.
        
        3) testing for failer is easy, but we can't guess jwt tokens for success scenairo so we will use mocks.
        
        4) if we used the way of overwriting like we overwrite the jwt.verify because we cannot pass a valid token becaus we can't guess it
           this has a huge disadvantage, because tests executs in order, and i made this test number 1, so I moved it up,
           the test that say (should throw an error if the token cannot be verified) would always fail, because we changed the actual implementation of the verify method
           for that install sinon ===> npm install --save-dev sinon
*/