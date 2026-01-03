import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Aquecimento
        { duration: '1m', target: 50 },   // Carga Normal (Baseline)
        { duration: '2m', target: 150 },  // Rampa de Estresse (Onde a mágica acontece)
        { duration: '30s', target: 0 },   // Resfriamento
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'], // Erros abaixo de 5%
        http_req_duration: ['p(95)<3000'], // 95% das requisições abaixo de 3s
    },
};

const RESILIENT_SERVICE_URL = __ENV.RESILIENT_SERVICE_URL || 'http://localhost:3000/orders';
const FRAGILE_SERVICE_URL = __ENV.FRAGILE_SERVICE_URL || 'http://localhost:3002/orders';

export default function () {
    const payload = JSON.stringify({
        orderId: `order_${Math.floor(Math.random() * 10000)}`,
        amount: 100,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Alterna entre chamar o serviço resiliente e o frágil para comparação
    // Em um cenário real, você pode rodar testes separados, mas aqui vamos misturar para gerar carga simultânea

    // 1. Chamada para o Serviço Resiliente
    const res1 = http.post(RESILIENT_SERVICE_URL, payload, params);
    check(res1, {
        'Resilient status is 200/202': (r) => r.status === 200 || r.status === 202,
    });

    // 2. Chamada para o Serviço Frágil
    const res2 = http.post(FRAGILE_SERVICE_URL, payload, params);
    check(res2, {
        'Fragile status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
