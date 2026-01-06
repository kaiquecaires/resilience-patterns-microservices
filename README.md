# Projeto de Pesquisa: Padrões de Resiliência em Microsserviços

Este repositório contém a implementação prática para o Trabalho de Conclusão de Curso (TCC) sobre **Padrões de Resiliência em Arquiteturas de Microsserviços**. O projeto demonstra e compara o comportamento de um serviço resiliente (implementando padrões como Circuit Breaker, Retry e Timeout) contra um serviço frágil (sem tratamento de falhas) quando comunicam com um serviço instável.

## 🏗 Arquitetura do Projeto

O ambiente é composto por microsserviços Node.js containerizados, monitorados por Prometheus e visualizados no Grafana. Testes de carga são executados via k6.

```mermaid
graph TD
    User((Usuário / k6)) -->|Requisições HTTP| OS[Order Service<br/>(Resiliente)]
    User -->|Requisições HTTP| OSF[Order Service Fragile<br/>(Sem Resiliência)]
    
    subgraph "Ambiente Controlado"
        OS -->|Com Padrões: Retry, Timeout,<br/>Circuit Breaker| PS[Payment Service<br/>(Instável)]
        OSF -->|Chamada Direta| PS
    end
    
    PS -.->|Métricas| Prom[Prometheus]
    OS -.->|Métricas| Prom
    OSF -.->|Métricas| Prom
    
    Prom --> Grafana[Grafana Dashboard]
```

### Componentes

1.  **Order Service (Resiliente)**:
    *   Implementa **Circuit Breaker** (fechado, aberto, semi-aberto).
    *   Implementa **Retry** (tentativas automáticas em falhas).
    *   Implementa **Timeout** (limite de tempo para respostas).
    *   Porta: `3000`

2.  **Order Service Fragile (Frágil)**:
    *   Serviço padrão sem implementações de resiliência.
    *   Serve como linha de base para comparação (baseline).
    *   Porta: `3002`

3.  **Payment Service (Instável)**:
    *   Simula um comportamento determinístico de falhas em um ciclo de 2 minutos:
        *   **0s - 30s**: Sucesso (Respostas rápidas).
        *   **30s - 60s**: Latência (Delay de 30s).
        *   **60s - 90s**: Erro (Retorna status 500).
        *   **90s - 120s**: Sucesso.
    *   Porta: `3001`

4.  **Monitoramento**:
    *   **Prometheus**: Coleta métricas dos serviços a cada 5 segundos.
    *   **Grafana**: Visualiza as métricas e o estado do sistema.
    *   **k6**: Gera tráfego de carga para estressar os serviços.

---

## 🚀 Como Iniciar e Rodar

### Pré-requisitos
*   Docker
*   Docker Compose

### Passo a Passo

1.  **Clone o repositório** (se ainda não o fez).

2.  **Suba o ambiente** com Docker Compose:
    ```bash
    docker-compose up --build -d
    ```
    Isso irá construir as imagens e iniciar todos os containers (`order-service`, `payment-service`, `order-service-fragile`, `prometheus`, `grafana`).

3.  **Execute os Testes de Carga (k6)**:
    O container do k6 está configurado para rodar o script automaticamente. Se precisar rodar manualmente ou verificar os logs:
    ```bash
    # Para ver os logs da execução automática
    docker-compose logs -f k6
    ```

    O script do k6 enviará requisições tanto para o serviço resiliente quanto para o frágil, permitindo a comparação em tempo real.

---

## 📊 Monitoramento e Métricas

### Acessando os Dashboards

*   **Grafana**: [http://localhost:3005](http://localhost:3005)
    *   **Usuário**: `admin`
    *   **Senha**: `admin`
    *   *Nota: Se configurado, navegue até a pasta `Dashboards` para ver o painel criado para este projeto.*
    
    #### Importação do Dashboard (Manual)
    O dashboard **Comparativo de Resiliência** já deve ser carregado automaticamente via Docker (provisioning). Caso precise importá-lo manualmente:
    
    1.  Localize o arquivo JSON no projeto: `grafana/provisioning/dashboards/service_comparison.json`.
    2.  No Grafana, clique no ícone **Dashboards** (menu lateral) > **New** > **Import**.
    3.  Copie e cole o conteúdo do arquivo JSON ou faça o upload do arquivo.
    4.  Selecione o Datasource **Prometheus** se solicitado e clique em **Import**.

*   **Prometheus**: [http://localhost:9090](http://localhost:9090)
    *   Utilize para consultas diretas (ad-hoc) das métricas se necessário.

### Métricas Disponíveis e Significados

O projeto exporta métricas padrão do Node.js e métricas customizadas para análise de resiliência.

#### Métricas de Negócio e Resiliência (Order Service)

| Métrica (Prometheus Key) | Tipo | Descrição e Significado |
| :--- | :--- | :--- |
| `circuit_breaker_state` | Gauge | Indica o estado atual do disjuntor.<br>• **0**: Fechado (Operação normal).<br>• **1**: Aberto (Falha detectada, requisições bloqueadas).<br>• **2**: Semi-Aberto (Testando recuperação). |
| `circuit_breaker_ops_total` | Counter | Total de operações processadas pelo Circuit Breaker, categorizadas por resultado (`success`, `failure`, `timeout`, `reject`). Essencial para calcular taxas de erro. |
| `circuit_breaker_fallback_total` | Counter | Contagem de quantas vezes o mecanismo de **Fallback** foi acionado. Indica que o serviço protegeu o usuário de um erro bruto, retornando uma resposta degradada (ex: "pedido pendente"). |
| `http_request_duration_seconds` | Histogram | Mede a latência das requisições. Importante para observar como o **Timeout** corta requisições lentas no serviço resiliente em comparação aos longos tempos de espera no serviço frágil. |
| `http_requests_in_flight` | Gauge | Número de requisições sendo processadas no momento. Um pico alto no serviço frágil durante a fase de latência indica congestionamento (threads presas). |

#### Comparativo Esperado no Grafana

Ao analisar os gráficos durante o ciclo de 2 minutos do Payment Service:

1.  **Fase de Latência (30s delay)**:
    *   **Serviço Frágil**: `http_requests_in_flight` deve subir drasticamente e `http_request_duration_seconds` aumentará para >30s.
    *   **Serviço Resiliente**: O padrão de **Timeout** abortará as requisições rapidamente (< 1s ou conforme configurado). O `circuit_breaker_state` pode transitar para Aberto se os timeouts excederem o limite de erro.

2.  **Fase de Erro (Status 500)**:
    *   **Serviço Frágil**: Retornará erros 500 diretamente para o usuário.
    *   **Serviço Resiliente**:
        *   O **Retry** pode tentar salvar algumas requisições se for uma falha transiente (embora neste laboratório o erro seja persistente por 30s).
        *   O **Circuit Breaker** abrirá (`state = 1`), parando de enviar requisições ao serviço de pagamento e retornando **Fallback** imediato (rápido e sem erro 500 para o cliente, apenas uma resposta "Pendente").

3.  **Recuperação**:
    *   O Circuit Breaker entrará em **Semi-Aberto** (`state = 2`), deixará passar algumas requisições de teste e, ao confirmar sucesso, fechará (`state = 0`) automaticamente.
