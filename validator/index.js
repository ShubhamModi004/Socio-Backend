
const {
    validationResult, check
} = require('express-validator');

// exports.createPostValidator = (req, res, next) => {
//     // title
//     req.check('title', "Write a title").notEmpty()
//     req.check('title', 'Title Must be between 4 to 150 characters').isLength({
//         min: 4,
//         max: 150
//     });
//     // body
//     req.check('body', "Write a body").notEmpty()
//     req.check('body', 'Body Must be between 4 to 2000 characters').isLength({
//         min: 4,
//         max: 2000
//     });

//     // check for errors
//     const errors = req.validationErrors()
//     // if error show the first as they happen
//     if (errors) {
//         const firstError = errors.map(error => error.msg)[0]
//         return res.status(400).json({ error: firstError })
//     }
//     // proceed to next middleware

//     next();
// }


exports.passwordResetValidator = (req, res, next) => {
    // check for password
    req.check("newPassword", "Password is required").notEmpty();
    req.check("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 chars long")
        .matches(/\d/)
        .withMessage("must contain a number")
        .withMessage("Password must contain a number");

    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware or ...
    next();
};

