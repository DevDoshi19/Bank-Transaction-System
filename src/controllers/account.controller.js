const accountModel = require("../models/account.model");

async function createAccount(req,res){

    const user = req.user;

    const isAccountExists = await accountModel.findOne({user:user._id})

    if(isAccountExists){
        return res.status(400).json({
            message:"Account already exists for this user"
        })
    }

    const account = await accountModel.create({
        user:user._id,
    })

    res.status(201).json({
        message:"Account created successfully",
        account
    })

}

module.exports = {
    createAccount
}