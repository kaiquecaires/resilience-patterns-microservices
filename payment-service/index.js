const express = require('express');
const client = require('prom-client'); // Prometheus client

const app = express();
const PORT = 3001;

const startTime = Date.now();

// Coleta métricas padrão do Node.js
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Endpoint para o Prometheus coletar as métricas
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.use(express.json());

app.post('/payments', (req, res) => {
    const { orderId, amount } = req.body;

    const elapsedTime = Date.now() - startTime;
    const cycleTime = elapsedTime % (12 * 60 * 1000); // 12 minutes cycle in ms
    const minutesInCycle = cycleTime / 60000;

    // 0-3m: Success
    // 3-6m: Latency 30s
    // 6-9m: Error
    // 9-12m: Success

    if (minutesInCycle < 3) {
        // Phase 1: Success (0-3m)
        console.log(`[Pagamento] [Phase 1: Success] Pedido processado (${minutesInCycle.toFixed(2)}m): ${orderId}`);
        return res.status(200).json({
            status: 'confirmed',
            transactionId: `txn_${Date.now()}`,
            orderId
        });
    } else if (minutesInCycle < 6) {
        // Phase 2: Latency 30s (3-6m)
        console.log(`[Pagamento] [Phase 2: 30s Delay] Aguardando 30s... (${minutesInCycle.toFixed(2)}m): ${orderId}`);
        setTimeout(() => {
            console.log(`[Pagamento] [Phase 2: 30s Delay] Respondendo sucesso após delay (${minutesInCycle.toFixed(2)}m): ${orderId}`);
            return res.status(200).json({
                status: 'confirmed',
                transactionId: `txn_${Date.now()}`,
                orderId
            });
        }, 30000);
    } else if (minutesInCycle < 9) {
        // Phase 3: Error (6-9m)
        console.log(`[Pagamento] [Phase 3: Error] Falha intencional (${minutesInCycle.toFixed(2)}m): ${orderId}`);
        return res.status(500).json({ error: 'Falha intencional no processamento do pagamento' });
    } else {
        // Phase 4: Success (9-12m)
        console.log(`[Pagamento] [Phase 4: Success] Pedido processado (${minutesInCycle.toFixed(2)}m): ${orderId}`);
        return res.status(200).json({
            status: 'confirmed',
            transactionId: `txn_${Date.now()}`,
            orderId
        });
    }
});

app.listen(PORT, () => {
    console.log(`Serviço de Pagamentos rodando na porta ${PORT}`);
});
