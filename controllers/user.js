const _ = require('lodash');
const User = require("../models/User");
const formidable = require('formidable');
const fs = require('fs');

exports.userById = (req, res, next, id) => {
    User.findById(id)
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .exec((err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: "User not found"
                })

            }
            req.profile = user // add profile object in req with user ino
            next();
        })
}


exports.hasAuthorization = (req, res, next) => {
    const authorized = req.profile && req.auth && req.profile._id === req.auth._id
    if (!authorized) {
        return res.status(403).json({
            error: 'User is not authorized to perform this action'
        });
    }
};


exports.allUsers = async (req, res, next) => {
    try {
        let users = await User.find().select("-__v -hashed_password -salt -photo")
        if (!users) return res.status(404).json({ msg: 'Users not found' });
        // Make sure user owes the contact
        res.json(users)
    } catch (err) {
        console.error(er.message);
        res.status(500).send('Server Error');
    }
}


exports.getUser = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
}


// exports.updateUser = async (req, res, next) => {
//     let user = req.profile;

//     user = _.extend(user, req.body); // mutate the source object.
//     user.updated = Date.now()
//     try {
//         await user.save();
//         user.hashed_password = undefined;
//         user.salt = undefined;
//         res.json({ user })
//     } catch (err) {
//         console.error(err.message);
//         res.status(400).json({ msg: 'You are not authorized to perform this action' });
//     }
// }

exports.updateUser = (req, res, next) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: "Photo could not be uploaded"
            })
        }
        // save
        let user = req.profile
        user = _.extend(user, fields)
        user.updated = Date.now()
        if (files.photo) {
            user.photo.data = fs.readFileSync(files.photo.path)
            user.photo.contentType = files.photo.type
        }
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({ error: err })
            }
            user.hashed_password = undefined
            user.salt = undefined
            res.json(user);
        })
    })
}

exports.deleteUser = async (req, res) => {
    let user = req.profile;
    try {
        await user.remove();
        res.json({ msg: 'User deleted Successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(400).send(err);
    }

}

exports.userPhoto = (req, res, next) => {
    if (req.profile.photo.data) {
        res.set(("Content-Type", req.profile.photo.contentType));
        return res.send(req.profile.photo.data);
    }
    next();
}

// follow and unfollow
exports.addFollowing = (req, res, next) => {
    User.findByIdAndUpdate(req.body.userId, { $push: { following: req.body.followId } },
        (err, result) => {
            if (err) {
                return res.status(400).json({ error: err });
            }
            next();
        });
}

exports.addFollower = (req, res) => {
    User.findByIdAndUpdate(
        req.body.followId,
        { $push: { followers: req.body.userId } },
        { new: true }
    )
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            result.hashed_password = undefined
            result.salt = undefined
            res.json(result)

        })
}
// removing followers and following

exports.removeFollowing = (req, res, next) => {
    User.findByIdAndUpdate(req.body.userId, { $pull: { following: req.body.unfollowId } },
        (err, result) => {
            if (err) {
                return res.status(400).json({ error: err });
            }
            next();
        });
}

exports.removeFollower = (req, res) => {
    User.findByIdAndUpdate(
        req.body.unfollowId,
        { $pull: { followers: req.body.userId } },
        { new: true }
    )
        .populate('following', '_id name')
        .populate('followers', '_id name')
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            result.hashed_password = undefined
            result.salt = undefined
            res.json(result)

        })
}

// finding people suggestion
exports.findPeople = (req, res) => {
    let following = req.profile.following
    following.push(req.profile._id)
    User.find({ _id: { $nin: following } }, (err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json(users);
    }).select('name');
}