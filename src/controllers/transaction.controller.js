const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service")
const mongoose = require("mongoose");

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
        isValidElement: idempotencyKey
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
    5. Create transaction (PENDING)
    */

    const session = await mongoose.startSession();
    session.startTransaction();
}
