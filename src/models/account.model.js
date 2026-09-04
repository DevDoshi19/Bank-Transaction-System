const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Account must belong to a user"],
        // index:true - No need bec we are creating a compound index on user field to ensure that each user can have only one account
    },
    status:{
        type:String,
        enum:{
            values:["ACTIVE","INACTIVE","FROZEN"], 
            message:"Status must be either ACTIVE, INACTIVE or FROZEN"
        },
        default:"ACTIVE"
    },
    currency:{
        type:String,
        required:[true,"Currency is required"],
        default:"INR"
    },

},{
    timestamps:true
})

// Create an index ( compound index -> when index are apply on multiple fields) to ensure that each user can have only one account
accountSchema.index({user:1},{unique:true}) // Ensure that each user can have only one account

accountSchema.methods.getBalance = async function(){
    const balanceData = await ledgerModel.aggregate([
        {$match:{account:this._id}},
        {
            $group:{
                _id:null,
                totalDebit :{$sum:{$cond:[{$eq:["$type","DEBIT"]},"$amount",0]}},
                totalCredit :{$sum:{$cond:[{$eq:["$type","CREDIT"]},"$amount",0]}},
            }
        },
        {
            $project:{
                _id:0,
                balance:{$subtract:["$totalCredit","$totalDebit"]},
            }
        }
    ]);
    return balanceData.length > 0 ? balanceData[0].balance : 0;
}


const accountModel = mongoose.model("account",accountSchema)
module.exports = accountModel;