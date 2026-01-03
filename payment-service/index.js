const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.post('/payments', (req, res) => {
    const { orderId, amount } = req.body;
    
    // Simulate Random Latency (0ms to 3000ms)
    const latency = Math.floor(Math.random() * 3000);
    
    setTimeout(() => {
        // Simulate Random Failure (50% chance)
        const shouldFail = Math.random() < 0.5;

        if (shouldFail) {
            console.log(`[Payment] Failed to process order: ${orderId} (Latency: ${latency}ms)`);
            return res.status(500).json({ error: 'Payment processing failed due to internal error' });
        }

        console.log(`[Payment] Successfully processed order: ${orderId} for $${amount} (Latency: ${latency}ms)`);
        res.status(200).json({ 
            status: 'confirmed', 
            transactionId: `txn_${Date.now()}`,
            orderId 
        });

    }, latency);
});

app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});
