const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const emailService = require("../services/email.service")

/**
 * Handles new user registration.
 * @async
 * @route {POST} /api/auth/register
 * @access Public
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response with the created user data or error message.
 */


async function registerUser (req,res){
    const {email,name,password} = req.body ;

    if(!email || !name || !password) {
        res.status(400).json({
            message:"Please provide all the required fields"
        })
    }

    const isExists = await userModel.findOne(
        {$or: 
            [
                {name: name}, 
                {email: email}
            ]
        }
    )
    if(isExists) {
        return res.status(422).json({
            message:"User already exists",
            status:false,
        })
    }

    const user = await userModel.create({
        email,
        name,
        password
    })

    const token = jwt.sign(
        payload = 
        {
            user : user._id,
        },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn:"3d"
        }
    )

    // set the token in the cookie with httpOnly, secure and sameSite options
    res.cookie("token",token,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    })

    res.status(201).json({
        user:user._id,
        email:user.email,
        name:user.name,
        message:"User created successfully",
        status:true,
    })
    
    await emailService.sendRegistrationEmail(user.email,user.name);
}

/**
 * - user login controller
 * - POST /api/auth/login
 * @param {req} req 
 * @param {res} res 
 * @returns 
 */

async function loginUser (req,res){
    const {email,password} = req.body ;

    if (!email || !password) {
        return res.status(400).json({
            message:"Please provide all the required fields"
        })
    }

    const user = await userModel.findOne(
        {
            $or: [{ email: email }]
        }).select("+password")

    if (!user) {
        return res.status(404).json({
            message:"User not found"
        })
    }

    const hashPassword = await bcrypt.compare(password,user.password)
    
    if (!hashPassword) {
        return res.status(401).json({
            message:"Invalid credentials! Wrong email or password ",
        })
    }
     
    const token = jwt.sign(
        payload = 
            {
                user : user._id,
            },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn:"3d"
        }
    )

    res.cookie("token",token,{
        httpOnly:true,
        secure:true,
        sameSite:"strict",
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    })

    res.status(200).json({
        message:"Login successful",
        status:true,
    })
}

module.exports = {
    registerUser,
    loginUser
}
