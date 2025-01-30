const express = require("express");
const { getTransactionsByUserId, getAllTransactions, getTransactionById } = require('../controllers/transactionController');
const router = express.Router();

router.post('/user-transactions', getTransactionsByUserId );

router.get('all-transactions', getAllTransactions);

router.get('/transaction/:transactionId', getTransactionById);

module.exports = router;