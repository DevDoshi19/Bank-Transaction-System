const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');


/**
 *  - POST api/auth/register
 *  - register a new user
 */
router.post("/register",authController.registerUserController)

/**
 *  - POST api/auth/login
 *  - login the user and return a JWT token
 */
router.post("/login",authController.loginUserController)
/**
 *  - POST api/auth/logout
 *  - logout the user by invalidating the refresh token
 */
router.post("/logout", authController.logoutController)

module.exports = router;