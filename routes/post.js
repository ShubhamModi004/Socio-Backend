const express = require('express');
const { requireSignin } = require('../controllers/auth');
const { getPosts, createPost, postByUser, postById, isPoster, deletePost, updatePost, photo, singlePost, like, unlike, comment, uncomment } = require('../controllers/post');
const { userById } = require('../controllers/user');
const { check } = require('express-validator');

const router = express.Router()


router.get('/posts', getPosts)
// like and unlike
router.put('/post/like', requireSignin, like);
router.put('/post/unlike', requireSignin, unlike);

// comments
router.put('/post/comment', requireSignin, comment);
router.put('/post/uncomment', requireSignin, uncomment);

router.post('/post/new/:userId', createPost, [requireSignin, [
    check('title', 'Title is required').not().isEmpty(),
    check('title', 'Title Should be more than 4 characters').isLength({ min: 4, max: 150 }),
    check('body', "Write a body").not().isEmpty(),
    check('body', "Body should be more than 4 characters").isLength({ min: 4, max: 2000 })
]])

router.get("/posts/by/:userId", requireSignin, postByUser);
router.get('/posts/:postId', singlePost);
router.delete('/post/:postId', requireSignin, isPoster, deletePost);
router.put('/post/:postId', requireSignin, isPoster, updatePost);


// for better image laod
router.get("/post/photo/:postId", photo)

// any route with user id our app will first execute
router.param("userId", userById);

// any route with user id our app will first execute
router.param("postId", postById)



module.exports = router;
