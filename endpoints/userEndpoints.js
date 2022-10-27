require('express');
require('mongodb');
const { json } = require('body-parser');
// import { sendConfirmationEmail } from '../emailService';

const jwt = require('../createJWT');
const User = require('../models/User');

exports.setUserEndpoints = function(app, client) {
    app.post('/api/login', async(req, res, next) => {
        // Incoming: username, password
        // Outgoing: User-object with JWT OR error

        let ret;
        const { username, password } = req.body;

        let result = await User.findOne()
            .or([{Username: username, Password: password}, {Email: username, Password: password}])
            .select('-Password');

        if (result) {
            try {
                let userObject = Object.assign({}, result)._doc;        // <result> is immutable, so this code bypasses that
                let token = jwt.createToken(JSON.stringify(userObject));
                ret = Object.assign({}, userObject, token);
            }
            catch(e) {
                ret = {error: e.message};
            }
        }
        else {
            ret = {error: 'Incorrect username/password combination'};
        }

        res.status(200).json(ret);
    });

    app.post('/api/register', async(req, res, next) => {
        // Incoming: firstName, lastName, email, username, password
        // Outgoing: error

        let ret, userExists;
        const { firstName, lastName, email, username, password } = req.body;

        userExists = await User.findOne().or([{Username: username}, {Email: email}]);
        if (userExists) {
            if (userExists.Username === username)
                ret = {error: 'A user with that username already exists'};
            else
                ret = {error: 'A user with that email already exists'};

            res.status(200).json(ret);
            return;
        }

        let newUser = new User({
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Username: username,
            Password: password
        });

        await newUser.save();
        ret = {error: ''};
        // sendConfirmationEmail(newUser);

        res.status(200).json(ret);
    });

    app.post('/api/sendFriendRequest', async(req, res, next) => {
        // Incoming: userID (_id of logged-in user) and friendID (_id of friend to add)
        // Outgoing: error

        let ret;
        const { userID, friendID } = req.body;

        // Track <user>'s request to <friend> to prevent duplicate sendings
        try {
            if (userID === friendID)
                throw {message: 'You cannot send a friend-request to yourself'};

            // Error-handling for <user>
            let user = await User.findOne({_id: userID});
            if (user === null)
                throw {message: `User with ${userID} does not exist`};
            if (user.SentRequests.includes(friendID))
                throw {message: 'You have already sent a friend-request to this user'};

            // Error-handling for <friend>
            let friend = await User.findOne({_id: friendID});
            if (friend === null)
                throw {message: `User with ${friendID} does not exist`};
            if (friend.PendingRequests.includes(userID))
                throw {message: 'You have already sent a friend-request to this user'};

            // Update <user> and <friend> documents after checking for all errors
            user.SentRequests.push(friendID);
            await user.save();
            friend.PendingRequests.push(userID);
            await friend.save();
        }
        catch(e) {
            ret = {error: e.message};
            res.status(200).json(ret);
            return;
        }

        ret = {error:''};
        res.status(200).json(ret);
    });

    app.post('/api/acceptFriendRequest', async(req, res, next) => {
        // Incoming: userID (_id of logged-in user) and friendID (_id of friend-request to accept)
        // Outgoing: error

        let ret;
        const { userID, friendID } = req.body;

        try {
            if (userID === friendID)
                throw {message: 'You cannot accept your own friend-request'};
            
            // Error-handling for <user>
            let user = await User.findOne({_id: userID});
            if (user === null)
                throw {message: `User with ${userID} does not exist`};
            if (!user.PendingRequests.includes(friendID))
                throw {message: `You did not receive a friend-request from ${friendID}`};
            if (user.Clique.includes(friendID))
                throw {message: `User with ${friendID} is already in your Clique`};

            // Error-handling for <friend>
            let friend = await User.findOne({_id: friendID});
            if (friend === null)
                throw {message: `User with ${friendID} does not exist`};
            if (!friend.SentRequests.includes(userID))
                throw {message: `User with ${friendID} did not send a friend-request to you`};
            if (friend.Clique.includes(userID))
                throw {message: `User with ${userID} is already in user with ${friendID}'s Clique`};
            
            // Remove <friendID> from <user>'s PendingRequests and SentRequests
            let indexInPending = user.PendingRequests.indexOf(friendID);
            let indexInSent = user.SentRequests.indexOf(friendID);
            if (indexInPending !== -1)
                user.PendingRequests.splice(indexInPending, 1);
            if (indexInSent !== -1)
                user.SentRequests.splice(indexInSent, 1);
            user.Clique.push(friendID);
            await user.save();

            // Remove <userID> from <friend>'s SentRequests and PendingRequests
            indexInSent = friend.SentRequests.indexOf(userID);
            indexInPending = friend.PendingRequests.indexOf(userID);
            if (indexInSent !== -1)
                friend.SentRequests.splice(indexInSent, 1);
            if (indexInPending !== -1)
                friend.PendingRequests.splice(indexInPending, 1);
            friend.Clique.push(userID);
            await friend.save();
        } catch(e) {
            ret = {error: e.message};
            res.status(200).json(ret);
            return;
        }

        ret = {error:''};
        res.status(200).json(ret);
    });
}