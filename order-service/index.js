const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
const client = require('prom-client'); // Prometheus client

const app = express();
const PORT = 3000;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001/payments';

// Coleta métricas padrão do Node.js (CPU, Memória, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Custom Metric: HTTP Request Duration
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1, 2, 5] // buckets for response time from 0.1s to 5s
});

// Custom Metric: Circuit Breaker State
const circuitBreakerState = new client.Gauge({
    name: 'circuit_breaker_state',
    help: 'State of the Circuit Breaker (0=Closed, 1=Open, 2=Half-Open)',
    labelNames: ['name']
});

// Custom Metric: Fallback executions
const circuitBreakerFallbackTotal = new client.Counter({
    name: 'circuit_breaker_fallback_total',
    help: 'Total number of fallback executions',
    labelNames: ['name']
});

// Custom Metric: Circuit Breaker Operations
const circuitBreakerOpsTotal = new client.Counter({
    name: 'circuit_breaker_ops_total',
    help: 'Total number of circuit breaker operations',
    labelNames: ['name', 'result'] // result: success, failure, timeout, reject
});

// Custom Metric: In-flight Requests
const inFlightRequests = new client.Gauge({
    name: 'http_requests_in_flight',
    help: 'Number of requests currently being processed',
    labelNames: ['method', 'route']
});

// Middleware to measure request duration
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    inFlightRequests.inc({ method: req.method, route: req.route ? req.route.path : req.path });

    res.on('finish', () => {
        inFlightRequests.dec({ method: req.method, route: req.route ? req.route.path : req.path });
        end({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            code: res.statusCode
        });
    });
    next();
});

// Endpoint para o Prometheus coletar as métricas
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.use(express.json());

// 1. PADRÃO DE TENTATIVA (RETRY)
// Configura o axios para tentar novamente 3 vezes se a requisição falhar (erro de rede ou status 5xx)
axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay, // Backoff exponencial: 2^retryCount * 100ms
    retryCondition: (error) => {
        // Tenta novamente em erros de rede ou códigos de status 5xx
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
    }
});

// Função para fazer a requisição HTTP
// 2. PADRÃO DE TEMPO LIMITE (TIMEOUT) (configurado na chamada axios)
async function makePaymentRequest(payload) {
    const response = await axios.post(PAYMENT_SERVICE_URL, payload, {
        timeout: 200 // 200 Milisegundos
    });
    return response.data;
}

// 3. PADRÃO DE DISJUNTOR (CIRCUIT BREAKER)
// Opções para o Opossum
const breakerOptions = {
    timeout: 3000, // Se a função demorar mais de 3s, aciona falha (segurança para o timeout do axios)
    errorThresholdPercentage: 50, // Se 50% das requisições falharem, abre o circuito
    resetTimeout: 10000 // Aguarda 10s antes de tentar novamente (estado Semi-Aberto)
};

const breaker = new CircuitBreaker(makePaymentRequest, breakerOptions);

// Função de fallback quando o circuito está aberto ou a requisição falha
breaker.fallback(() => {
    return {
        status: 'pending',
        message: 'O serviço de pagamentos está indisponível no momento. Seu pedido foi enfileirado.'
    };
});

// Monitoramento dos eventos do Circuit Breaker para métricas
breaker.on('fallback', () => circuitBreakerFallbackTotal.inc({ name: 'payment-service' }));
breaker.on('success', () => circuitBreakerOpsTotal.inc({ name: 'payment-service', result: 'success' }));
breaker.on('failure', () => circuitBreakerOpsTotal.inc({ name: 'payment-service', result: 'failure' }));
breaker.on('timeout', () => circuitBreakerOpsTotal.inc({ name: 'payment-service', result: 'timeout' }));
breaker.on('reject', () => circuitBreakerOpsTotal.inc({ name: 'payment-service', result: 'reject' }));

breaker.on('open', () => {
    console.log('🔴 Circuit Breaker está ABERTO');
    circuitBreakerState.set({ name: 'payment-service' }, 1);
});
breaker.on('halfOpen', () => {
    console.log('🟡 Circuit Breaker está SEMI-ABERTO');
    circuitBreakerState.set({ name: 'payment-service' }, 2);
});
breaker.on('close', () => {
    console.log('🟢 Circuit Breaker está FECHADO');
    circuitBreakerState.set({ name: 'payment-service' }, 0);
});

app.post('/orders', async (req, res) => {
    const { orderId, amount } = req.body;
    console.log(`[Pedido] Processando pedido ${orderId}...`);

    try {
        // Dispara o circuit breaker
        const result = await breaker.fire({ orderId, amount });

        if (result.status === 'pending') {
            // Resposta de fallback
            res.status(202).json(result);
        } else {
            // Resposta de sucesso
            res.status(200).json(result);
        }
    } catch (error) {
        console.error(`[Pedido] Erro ao processar pedido: ${error.message}`);
        res.status(500).json({ error: 'Erro Interno do Servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Serviço de Pedidos rodando na porta ${PORT}`);
});
