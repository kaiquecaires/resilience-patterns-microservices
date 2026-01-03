const express = require('express');
const axios = require('axios');
const client = require('prom-client'); // Prometheus client

const app = express();
const PORT = 3002; // Porta diferente dos outros serviços (3000 e 3001)
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001/payments';

// Coleta métricas padrão do Node.js
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Custom Metric: HTTP Request Duration
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1, 2, 5] // buckets for response time from 0.1s to 5s
});

// Middleware to measure request duration
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
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

// Rota para criar pedido SEM resiliência
app.post('/orders', async (req, res) => {
    const { orderId, amount } = req.body;
    console.log(`[Pedido Frágil] Processando pedido ${orderId}...`);

    try {
        // Chamada direta sem retry, sem circuit breaker, sem timeout curto
        const response = await axios.post(PAYMENT_SERVICE_URL, { orderId, amount });

        console.log(`[Pedido Frágil] Sucesso: ${JSON.stringify(response.data)}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`[Pedido Frágil] Erro ao processar pedido: ${error.message}`);

        if (error.response) {
            // Repassa o erro do serviço de pagamento
            res.status(error.response.status).json(error.response.data);
        } else {
            // Erro de rede ou timeout padrão do axios/node
            res.status(500).json({ error: 'Erro de comunicação com serviço de pagamentos' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Serviço de Pedidos (Frágil) rodando na porta ${PORT}`);
});
