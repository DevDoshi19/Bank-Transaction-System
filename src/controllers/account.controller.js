const accountModel = require("../models/account.model");
/**
 * - POST api/accounts/
 * - create a new account for the authenticated user
 */

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

/**
 * - GET api/accounts/
 * - get account details for the authenticated user
 */

async function getUserAccounts(req,res){

    const accounts = await accountModel.find({user:req.user._id})
    // console.log("accounts:", accounts);
    res.status(200).json({
        message:"User accounts fetched successfully",
        accounts:accounts
    })

}

/**
 * - GET api/accounts/balance/:accountId
 * - get account balance for the authenticated user
 */

async function getAccountBalance(req,res){
    const {accountId} = req.params;
    const account = await accountModel.findOne({user:req.user._id, _id:accountId})
    if(!account){
        return res.status(404).json({
            message:"Account not found for this user"
        })
    }
    const balance = await account.getBalance();
    res.status(200).json({
        message:"Account balance fetched successfully",
        balance
    })

}

module.exports = {
    createAccount,
    getUserAccounts,
    getAccountBalance,
}