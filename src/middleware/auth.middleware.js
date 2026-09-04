const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blackList.model");

async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({
          message:"Unauthorized access, token is missing"  
        })
    }
    const isblacklisted = await tokenBlacklistModel.findOne({token});
    if(isblacklisted){
        return res.status(401).json({
            message:"Unauthorized access, token is blacklisted"
        })
    }
    try{

        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
        if (!decoded) {
            return res.status(401).json({
                message:"Unauthorized access, Token is invalid"
            })
        }
        const user = await userModel.findById(decoded.user)

        req.user = user;

        next();

    }
    catch(error){
        return res.status(401).json({
            message:"Unauthrozied access, Token is invalid"
        })
    }
}

async function authsystemUserMiddleware(req,res,next){

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        });
    }
    const isblacklisted = await tokenBlacklistModel.findOne({token});
    if(isblacklisted){
        return res.status(401).json({
            message:"Unauthorized access, token is blacklisted"
        })
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        const user = await userModel
            .findById(decoded.user)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found"
            });
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            });
        }

        req.user = user;

        next();

    } catch (err) {

        console.log(err);

        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });
    }
}
module.exports = {
    authMiddleware,
    authsystemUserMiddleware
}