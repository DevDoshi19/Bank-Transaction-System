const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must have a from account"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must have a to account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","COMPLETED","FAILED","REVERSED"], 
            message:"Status must be either PENDING, COMPLETED or FAILED"
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"Transaction must have an amount"],
        min:[1,"Transaction amount must be greater than 0"]
    },
    // always generated at client side and sent to server, so that we can verify the transaction is valid or not, if the transaction is valid then we will process it, if not then we will reject it
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required to create a new transaction"],
        index:true,
        unique:true
    }
},{
    timestamps:true
})

const transactionModel = mongoose.model("transaction",transactionSchema)
module.exports = transactionModel;