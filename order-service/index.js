const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');

const app = express();
const PORT = 3000;
const PAYMENT_SERVICE_URL = 'http://localhost:3001/payments';

app.use(express.json());

// 1. RETRY PATTERN
// Configures axios to retry 3 times if the request fails (network error or 5xx status)
axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff: 2^retryCount * 100ms
    retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
    }
});

// Function to make the HTTP request
// 2. TIMEOUT PATTERN (configured in axios call)
async function makePaymentRequest(payload) {
    const response = await axios.post(PAYMENT_SERVICE_URL, payload, {
        timeout: 2000 // 2 seconds timeout
    });
    return response.data;
}

// 3. CIRCUIT BREAKER PATTERN
// Options for Opossum
const breakerOptions = {
    timeout: 3000, // If function takes longer than 3s, trigger failure (failsafe for axios timeout)
    errorThresholdPercentage: 50, // If 50% of requests fail, open circuit
    resetTimeout: 10000 // Wait 10s before trying again (Half-Open state)
};

const breaker = new CircuitBreaker(makePaymentRequest, breakerOptions);

// Fallback function when circuit is open or request fails
breaker.fallback(() => {
    return {
        status: 'pending',
        message: 'Payment service is currently unavailable. Your order has been queued.'
    };
});

// Event listeners for logging
breaker.on('open', () => console.log('🔴 Circuit Breaker is OPEN'));
breaker.on('halfOpen', () => console.log('🟡 Circuit Breaker is HALF-OPEN'));
breaker.on('close', () => console.log('🟢 Circuit Breaker is CLOSED'));

app.post('/orders', async (req, res) => {
    const { orderId, amount } = req.body;
    console.log(`[Order] Processing order ${orderId}...`);

    try {
        // Fire the circuit breaker
        const result = await breaker.fire({ orderId, amount });

        if (result.status === 'pending') {
            // Fallback response
            res.status(202).json(result);
        } else {
            // Success response
            res.status(200).json(result);
        }
    } catch (error) {
        console.error(`[Order] Error processing order: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
});
