const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service")
const mongoose = require("mongoose");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req,res){
    /*
    1. Validate request
    */
    const {fromAccount,toAccount,amount,idempotencyKey} = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message:"Please provide all the required fields ( fromAccount, toAccount, amount, idempotencyKey )"
        })
    }
    
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount 
    });

    const toUserAccount = await accountModel.findOne({ 
        _id: toAccount 
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({
            message: "One or both accounts not found"
        });
    }

    /*
    2. Validate idempotency key
    */
    const isTransactionExists = await transactionModel.findOne({
        idempotencyKey
    })

    if (isTransactionExists) {
        if (isTransactionExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction with this idempotency key has already been completed",
                status: isTransactionExists.status,
                data: isTransactionExists
            });
        }
        else if (isTransactionExists.status === "PENDING") {
            return res.status(202).json({
                message: "Transaction with this idempotency key is still pending, please wait for it to complete"
            });
        }
        else if (isTransactionExists.status === "FAILED") {
            return res.status(422).json({
                message: "Transaction processing failed for this idempotency key, please try again"
            });
        }
        else if (isTransactionExists.status === "REVERSED") {
            return res.status(200).json({
                message: "Transaction with this idempotency key has been reversed, please try again",
                status: isTransactionExists.status,
                data: isTransactionExists
            });
        }
        else {
            // Handle unexpected status safety net
            return res.status(500).json({ 
                message: "Unknown transaction status." 
            });
        }
    }
    
    /*
    3. Check account status
    */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(403).json({
            message: "One or both accounts are not active, transaction cannot be processed"
        });
    }

    /*
    4. Derive sender balance from ledger
    */
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: "Insufficient balance in sender account",
            senderBalance: balance,
            requestedAmount: amount
        });
    }
    
    /*
    5. Create transaction (PENDING) to step 5 to 7 there will be need of transaction session to ensure that all the steps are completed successfully or none of them are completed, so that we can maintain the consistency of the data in the database
    even one of theme is failed then we will rollback the transaction and return the error to the user, so that user can try again, and we will not have any inconsistent data in the database
    */

    const session = await mongoose.startSession();
    let transaction;
    try{
        session.startTransaction();

        transaction = new transactionModel({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        });
        await transaction.save({
            session
        });
        
        console.log("🟡 Transaction saved as PENDING");
        await sleep(15000);
        console.log("🟢 4 seconds completed");

        /*
        6. Create DEBIT ledger entry
        7. Create CREDIT ledger entry
        */

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            type: "DEBIT",
            transaction: transaction._id
        }], { 
            session 
        });

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            type: "CREDIT",
            transaction: transaction._id
        }], { 
            session 
        });


        /*
        8. Mark transaction COMPLETED
        9. Commit MongoDB session
        */

        transaction.status = "COMPLETED";
        await transaction.save({ 
            session 
        });
        // Commit
        await session.commitTransaction();

    }catch (error) {

        console.error("TRANSACTION ERROR:", error);

        await session.abortTransaction();

        return res.status(500).json({
            message: "Transaction failed",
            success: false,
            error: error.message
        });

    } finally {
        await session.endSession();
    }

    /*
    10. Send email notification
    */
    // if (transaction.status === "COMPLETED") {
    //     await emailService.sendTransactionEmail(
    //         req.user.email,
    //         req.user.name,
    //         amount,
    //         toAccount,
    //     );
    // }
    // else if (transaction.status === "FAILED") {
    //     await emailService.sendTransactionFailureEmail(
    //         req.user.email,
    //         req.user.name,
    //         amount,
    //         toAccount,
    //     );
    // }
    return res.status(201).json({
        message: "Transaction completed successfully",
        data: transaction
    });
}

async function createInitialFundsTransaction(req,res){
    const {toAccount,amount,idempotencyKey} = req.body ;
    if (!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"toAccount, amount and idempotency key are require",
            success:false
        })
    }

    // console.log("accountModel:", accountModel);
    // console.log("accountModel.findOne:", accountModel.findOne);

    const toAccountUser = await accountModel.findOne({_id:toAccount})
    if (!toAccountUser){
        return res.status(404).json({
            message:"toAccount not found",
            success:false
        })
    }
    
    const fromUserAccount = await accountModel.findOne({
        user:req.user._id
    });

    if(!fromUserAccount){
        return res.status(403).json({
            message:"System user account not found",
            success:false
        })
    }

    const session = await mongoose.startSession();
    try {

        session.startTransaction();

        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount: toAccountUser._id,
            amount,
            idempotencyKey,
            status:"PENDING"
        })

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromUserAccount._id,
            type: "DEBIT",
            amount: amount,
            transaction:transaction._id
        }],{
            session
        })
        
        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccountUser._id,
            type: "CREDIT",
            amount: amount,
            transaction:transaction._id
        }],{
            session
        })

        transaction.status = "COMPLETED";
        await transaction.save({ 
            session 
        });

        await session.commitTransaction();
        // session.endSession();

        return res.status(200).json({
            message:"Initial funds transaction completed successfully",
            data : {
                transaction : transaction 
            }
        })
    }catch (error) {

    console.error("INITIAL FUNDS ERROR:", error);

    await session.abortTransaction();
    
    return res.status(500).json({
        message: "Transaction failed",
        success: false,
        error: error.message
    });
    } finally {
        session.endSession();
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
