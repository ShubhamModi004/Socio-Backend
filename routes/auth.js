const express = require('express');
const { signup, signin, signout, forgotPassword, resetPassword } = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { check } = require('express-validator');
const { passwordResetValidator } = require("../validator");
const router = express.Router()


router.post('/signup', [
    check('name', 'Name is required')
        .not().isEmpty(),
    check('email', 'Please enter a valid Email')
        .not().isEmpty().isEmail(),
    check('password', "Password should be more than 6 characters")
        .isLength({ min: 6 }).matches(/\d/).withMessage("Password should contain a number")
], signup)

router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);


router.post('/signin', signin)

router.get('/signout', signout)

// any route with user id our app will first execute
router.param("userId", userById);



module.exports = router;
