const express = require('express');
const { allUsers, userById, getUser, updateUser, deleteUser, userPhoto, addFollowing, addFollower, removeFollowing, removeFollower, findPeople } = require('../controllers/user');
const { requireSignin } = require('../controllers/auth');
const router = express.Router()


router.put('/user/follow', requireSignin, addFollowing, addFollower);
router.put('/user/unfollow', requireSignin, removeFollowing, removeFollower);

router.get("/users", allUsers);
router.get("/user/:userId", requireSignin, getUser);
router.put("/user/:userId", requireSignin, updateUser);
router.delete("/user/:userId", requireSignin, deleteUser);

// for better image laod
router.get("/user/photo/:userId", userPhoto)

// any route with user id our app will first execute
router.param("userId", userById);

// who to follow
router.get("/user/findpeople/:userId", requireSignin, findPeople)


module.exports = router;