const {
    validationResult
} = require('express-validator');
const Post = require("../models/post");
const formidable = require("formidable");
const fs = require("fs");

// importing lodash
const _ = require('lodash');

exports.postById = async (req, res, next, id) => {
    try {
        const post = await Post.findById(id)
            .populate("postedBy", "_id name")
            .populate('comments', 'text created')
            .populate('commments.postedBy', '_id name')
        req.post = post
        next()
    } catch (error) {
        console.error(err.message);
        res.status(400).json({
            error: err
        })
    }
}

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({
            created: -1
        }).populate("postedBy", "_id name")
            .populate('comments', 'text created')
            .populate('commments.postedBy', '_id name')
            .select("-__v -photo")
        res.json(posts)
    } catch (err) {
        console.error(err.message);
        res.status(400).send('Server Error');
    }
}


exports.createPost = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: "Image not uploaded"
            })
        }
        let post = new Post(fields);
        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        post.postedBy = req.profile;

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path)
            post.photo.contentType = files.photo.type
        }
        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            res.json(result);
        })
    })
}




exports.postByUser = async (req, res) => {
    try {
        const posts = await Post.find({
            postedBy: req.profile._id
        }).populate("postedBy", "_id name").sort("_created").select("-photo")
        if (!posts) {
            return res.status(404).json({
                msg: 'Post not found'
            });
        }
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(400).send('Server Error');
    }

}

exports.isPoster = (req, res, next) => {
    let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id
    if (!isPoster) {
        return res.status(403).json({
            error: "User is not authorized"
        })
    }
    next();
}

exports.deletePost = (req, res) => {
    let post = req.post
    if (!post) {
        return res.json({
            message: 'Post doesnot exists'
        })
    }
    post.remove((err, post) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json({
            message: "Post deleted successfully"
        });
    })
}

exports.updatePost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }
        // save post
        let post = req.post;
        post = _.extend(post, fields);
        post.updated = Date.now();

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.type;
        }

        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json(post);
        });
    });
};

// fetching only post
exports.photo = (req, res, next) => {
    res.set("Content-Type", req.post.photo.contentType)
    return res.send(req.post.photo.data);
}

exports.singlePost = (req, res) => {
    return res.json(req.post);
}

// like and unlike
exports.like = (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { likes: req.body.userId } },
        { new: true }
    ).exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        else {
            res.json(result)
        }
    });
}

exports.unlike = (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { likes: req.body.userId } },
        { new: true }
    ).exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        else {
            res.json(result)
        }
    });
}

// comment and uncomment
exports.comment = (req, res) => {
    let comment = req.body.comment
    comment.postedBy = req.body.userId
    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { comments: comment } },
        { new: true }
    )
        .populate('comments.postedBy', '_id name')
        .populate("postedBy", "_id name")
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            else {
                res.json(result)
            }
        });

}

exports.uncomment = (req, res) => {
    let comment = req.body.comment

    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { comments: { _id: comment._id } } },
        { new: true }
    )
        .populate('comments.postedBy', '_id name')
        .populate("postedBy", "_id name")
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            else {
                res.json(result)
            }
        });

}