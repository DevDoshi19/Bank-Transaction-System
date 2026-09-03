const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({
          message:"Unauthorized access, token is missing"  
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

module.exports = authMiddleware;