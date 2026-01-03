const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');

const app = express();
const PORT = 3000;
const PAYMENT_SERVICE_URL = 'http://localhost:3001/payments';

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
        timeout: 2000 // 2 seconds timeout
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

// Listeners de eventos para logs
breaker.on('open', () => console.log('🔴 Circuit Breaker está ABERTO'));
breaker.on('halfOpen', () => console.log('🟡 Circuit Breaker está SEMI-ABERTO'));
breaker.on('close', () => console.log('🟢 Circuit Breaker está FECHADO'));

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
