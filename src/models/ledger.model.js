const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Ledger must belong to an account"],
        index:true,
        immutable:true, // this will ensure that the account field cannot be updated once it is set
    },
    amount:{
        type:Number,
        required:[true,"Ledger must have an amount"],
        immutable:true,
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true,"Ledger must belong to a transaction"],
        index:true,
        immutable:true,
    },
    type:{
        type:String,
        enum:{
            values:["CREDIT","DEBIT"], 
            message:"Type must be either CREDIT or DEBIT"
        },
        required:[true,"Ledger must have a type"],
        immutable:true,
    }

},{
    timestamps:true
})

function preventLedgerModification(){
    throw new Error("Ledger cannot be modified once it is created")
}

ledgerSchema.pre('findOneAndUpdate',preventLedgerModification);
ledgerSchema.pre('deleteOne',preventLedgerModification);
ledgerSchema.pre('deleteMany',preventLedgerModification);
ledgerSchema.pre('updateOne',preventLedgerModification);
ledgerSchema.pre('remove',preventLedgerModification);
ledgerSchema.pre('updateMany',preventLedgerModification);
ledgerSchema.pre('findOneAndDelete',preventLedgerModification);
ledgerSchema.pre('findOneAndReplace',preventLedgerModification);

const ledgerModel = mongoose.model("ledger",ledgerSchema)
module.exports = ledgerModel;