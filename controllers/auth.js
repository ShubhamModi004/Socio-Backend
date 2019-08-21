const jwt = require('jsonwebtoken');
const _ = require("lodash");
const { sendEmail } = require("../helpers");
// load env
const dotenv = require("dotenv");
dotenv.config();
const expressJwt = require('express-jwt');
const User = require("../models/user");
const { validationResult } = require('express-validator');


exports.signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, name, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    const user = await new User({
        name,
        email,
        password
    });
    await user.save()
    res.json({ msg: "Signup Success" });
}

// signing out the user
exports.signout = (req, res) => {

    res.clearCookie("t");
    return res.json({ message: "Signed Out" });
}

exports.signin = (req, res) => {
    // find the user based on email
    const { email, password } = req.body;
    User.findOne({ email }, (err, user) => {
        // if err or no user
        if (err || !user) {
            return res.status(401).json({
                errors: ["No user found"]
            })
        }
        //  if user is found make sure the email and password mathc
        if (!user.authenticate(password)) {
            return res.status(401).json({
                errors: ["Email and password doesnt match"]
            })
        }
        // generate a token as t in cookie with expiry date
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        // persist t in cookie with expiry date
        res.cookie("t", token, { expire: new Date() + 9999 })

        // return response with user and token to front end client
        const { _id, name, email } = user;
        return res.json({ token, user: { _id, email, name } });
    })
}


exports.requireSignin = expressJwt({
    //  if token is valid express jwt appends the verified users id
    // in an auth key to the request object
    secret: process.env.JWT_SECRET,
    userProperty: 'auth',

})


// add forgotPassword and resetPassword methods
exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: "No request body" });
    if (!req.body.email)
        return res.status(400).json({ message: "No Email in request body" });

    console.log("forgot password finding user with that email");
    const { email } = req.body;
    console.log("signin req.body", email);
    // find the user based on email
    User.findOne({ email }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "User with that email does not exist!"
            });

        // generate a token with user id and secret
        const token = jwt.sign(
            { _id: user._id, iss: "NODEAPI" },
            process.env.JWT_SECRET
        );

        // email data
        const emailData = {
            from: "noreply@node-react.com",
            to: email,
            subject: "Password Reset Instructions",
            text: `Please use the following link to reset your password: ${
            process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
            process.env.CLIENT_URL
            }/reset-password/${token}</p>`
        };

        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};

// to allow user to reset password
// first you will find the user in the database with user's resetPasswordLink
// user model's resetPasswordLink's value must match the token
// if the user's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right user

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "Invalid Link!"
            });

        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ""
        };

        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });

};