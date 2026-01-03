const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.post('/payments', (req, res) => {
    const { orderId, amount } = req.body;

    // Simula Latência Aleatória (0ms a 3000ms)
    const latency = Math.floor(Math.random() * 3000);

    setTimeout(() => {
        // Simula Falha Aleatória (50% de chance)
        const shouldFail = Math.random() < 0.5;

        if (shouldFail) {
            console.log(`[Pagamento] Falha ao processar pedido: ${orderId} (Latência: ${latency}ms)`);
            return res.status(500).json({ error: 'Falha no processamento do pagamento devido a erro interno' });
        }

        console.log(`[Pagamento] Pedido processado com sucesso: ${orderId} por R$${amount} (Latência: ${latency}ms)`);
        res.status(200).json({
            status: 'confirmed',
            transactionId: `txn_${Date.now()}`,
            orderId
        });

    }, latency);
});

app.listen(PORT, () => {
    console.log(`Serviço de Pagamentos rodando na porta ${PORT}`);
});
