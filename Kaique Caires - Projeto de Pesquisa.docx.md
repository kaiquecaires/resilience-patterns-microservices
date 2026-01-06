**Aluno(a): Kaique Gonçalves Coimbra Caires**  
**Orientador(a): Diego Marques De Carvalho**  
**Curso:** Engenharia de software

**Padrões de Resiliência em Microsserviços Aplicados a um Projeto de Pedidos**

**Introdução**

Devido ao aumento da complexidade e da demanda por softwares altamente escaláveis, fez-se necessário adotar novas abordagens de desenvolvimento, substituindo a arquitetura monolítica por uma arquitetura baseada em microsserviços. Esse modelo permite que diferentes componentes de um sistema se comuniquem entre si e sejam escalados de forma independente, favorecendo a flexibilidade e o crescimento horizontal das aplicações.  
Entretanto, a adoção desse paradigma trouxe novos desafios. O que antes era centralizado tornou-se distribuído, aumentando a vulnerabilidade a falhas externas. Quando um serviço apresenta indisponibilidade ou lentidão, o impacto pode se propagar para outros componentes interdependentes, gerando efeitos em cascata.  
Newman (2021) define os microsserviços como aplicações pequenas, autônomas e voltadas a uma única responsabilidade, o que facilita a manutenção e a escalabilidade independente. Contudo, Richardson (2018) ressalta que esse estilo arquitetural também introduz complexidades, como a necessidade de comunicação eficiente entre serviços, monitoramento distribuído e orquestração adequada.  
A resiliência, conforme definida por Woods (2006), representa a capacidade de um sistema manter seu funcionamento diante de falhas e perturbações — conceito essencial em sistemas distribuídos, nos quais a tolerância a falhas é fundamental para garantir a disponibilidade e a confiabilidade das aplicações. Nesse contexto, a aplicação de padrões de resiliência, como ”Circuit Breaker”, “Retry” e “Timeout”, torna-se fundamental para minimizar impactos e assegurar a estabilidade das comunicações entre microsserviços.

**Objetivo**

O objetivo deste projeto é abordar e aplicar padrões de resiliência que permitam que microsserviços se comuniquem de forma eficiente e segura diante de falhas. Para isso, serão desenvolvidos dois microsserviços — um responsável pelos pedidos e outro pelos pagamentos.  
O microsserviço de pagamentos será fictício e projetado para simular cenários de falhas e atrasos na comunicação, possibilitando a avaliação do comportamento do sistema em condições adversas. Dessa forma, será possível comparar o desempenho e a disponibilidade do sistema com e sem a utilização dos padrões “Circuit Breaker”, “Retry” e ”Timeout”.

**Metodologia ou Material e Métodos**

A metodologia proposta tem como objetivo avaliar o impacto da aplicação de padrões de resiliência em uma arquitetura de microsserviços. O estudo será conduzido em um ambiente de testes controlado, permitindo observar o comportamento dos serviços diante de falhas simuladas e analisar o efeito das estratégias aplicadas sobre o desempenho e a estabilidade do sistema.  
A elaboração deste projeto baseia-se em métodos e práticas consolidados na literatura sobre arquitetura de microsserviços e padrões de resiliência. Foram utilizados como referência autores que descrevem técnicas voltadas à tolerância a falhas em sistemas distribuídos, garantindo que os procedimentos empregados estejam alinhados às abordagens reconhecidas na área.  
Os conceitos e padrões aplicados — ”Circuit Breaker”, “Retry” e “Timeout” — seguem os princípios descritos por Nygard (2007) em “Release It\!”, complementados pelas recomendações de Richardson (2018) em Padrões de Microsserviços e de Newman (2021) em Construindo Microsserviços. Essas obras apresentam fundamentos técnicos sobre como prevenir falhas em cascata, controlar tempos de resposta e manter a estabilidade da comunicação entre serviços independentes.  
A definição de resiliência adotada neste estudo baseia-se em Woods (2006), que a descreve como a capacidade de um sistema manter seu funcionamento diante de falhas ou perturbações inesperadas. Essa perspectiva fundamenta a escolha dos métodos de simulação e análise utilizados no projeto, assegurando a consistência teórica das técnicas implementadas.  
Dessa forma, a literatura atua como referencial técnico para a descrição e a validação dos procedimentos, assegurando que o experimento possa ser reproduzido e comparado em contextos semelhantes.  
O ambiente de testes será composto por dois microsserviços desenvolvidos em “JavaScript”, utilizando “Node.js” e ferramentas voltadas ao desenvolvimento ”backend”. O primeiro microsserviço será responsável pela gestão de pedidos, enquanto o segundo representará o processamento de pagamentos.  
O microsserviço de pagamentos será fictício e configurado para simular falhas e atrasos, reproduzindo situações reais de instabilidade em sistemas distribuídos, como indisponibilidade temporária e alta latência. Essa abordagem permite analisar o comportamento do sistema diante de falhas parciais e verificar a eficácia dos padrões de resiliência aplicados.  
A comunicação entre os serviços ocorrerá por meio de requisições de Protocolo de Transferência de Hipertexto \[HTTP\] síncronas, reproduzindo a interação típica entre Interfaces de Programação de Aplicações \[APIs\] Transferência de Estado Representacional \[REST\]. Os padrões "Circuit Breaker", "Retry" e "Timeout" serão aplicados de forma incremental, de modo a possibilitar a comparação entre o comportamento do sistema com e sem o uso dessas estratégias.  
Durante a execução dos testes, serão coletadas métricas de desempenho e estabilidade com o auxílio de ferramentas especializadas de monitoramento, como o “Datadog” ou soluções equivalentes, a exemplo do “Prometheus” e do “Grafana”. Essas ferramentas permitirão acompanhar, em tempo real, indicadores que reflitam o comportamento do sistema sob diferentes condições de operação. Entre as variáveis observadas estão, além do tempo médio de resposta, os percentis de latência (P95 e P99) para identificar degradação na cauda da distribuição, a taxa de erro, o consumo de recursos computacionais (CPU, memória e conexões) para avaliar a eficiência das abordagens, e métricas específicas dos padrões de resiliência, como a taxa de acionamento de fallbacks e as transições de estado do Circuit Breaker.  
Os resultados obtidos serão analisados de forma comparativa, buscando identificar variações significativas entre os cenários com e sem a aplicação dos padrões de resiliência. Essa análise permitirá compreender o impacto de cada padrão sobre a estabilidade e o desempenho do sistema, além de evidenciar possíveis “trade-offs” entre confiabilidade e eficiência. A avaliação será conduzida de maneira exploratória e descritiva, utilizando os dados coletados para interpretar o comportamento dos microsserviços em situações de falha e para verificar em que medida as estratégias de resiliência contribuem para a robustez do ambiente distribuído.  
Com base nas observações e resultados obtidos, será elaborado um roteiro prático de aplicação de padrões de resiliência em projetos que utilizem arquitetura de microsserviços. Esse roteiro tem como propósito orientar equipes de desenvolvimento quanto à seleção e combinação adequadas dos padrões, de acordo com o contexto do sistema e o tipo de comunicação entre serviços.  
O material resultante buscará servir como guia técnico de referência, destacando as condições em que cada padrão se mostra mais eficaz e os cuidados necessários para evitar sobrecarga ou aumento desnecessário de complexidade. O objetivo é contribuir para a disseminação de boas práticas e para o fortalecimento da resiliência em sistemas distribuídos.

**Resultados Esperados**

Com esta pesquisa, espera-se identificar de maneira objetiva os benefícios da aplicação de padrões de resiliência em arquiteturas baseadas em microsserviços, bem como analisar os contextos em que cada padrão se mostra mais adequado e eficiente.

**Cronograma de Atividades**

| Atividades planejadas | Mês |  |  |  |
| :---- | ----- | ----- | ----- | ----- |
|  | **Nov/25** | **Dez/25** | **Jan/26** | **Fev/26** |
| Revisar estrutura do projeto de pesquisa |  |  |  |  |
| Reunir referências bibliográficas adicionais |  |  |  |  |
| Desenvolvimento do ambiente e implementação inicial |  |  |  |  |
| Aplicação dos padrões de resiliência e coleta de dados |  |  |  |  |
| Análise e redação dos resultados |  |  |  |  |
| Revisão final e entrega |  |  |  |  |

**Referências** 

Newman, S. 2021\. Construindo Microsserviços. 2\. ed. Novatec, São Paulo, Brasil.  
Nygard, M.T. 2018\. Release It\!: Design and Deploy Production-Ready Software. 2\. ed. Manning Publications, Shelter Island, NY, EUA.  
Richardson, C. 2022\. Padrões de Microsserviços: com Exemplos em Java. Novatec, São Paulo, Brasil.  
Woods, D.D. 2006\. Essential characteristics of resilience. p. 21-34. In: Hollnagel, E.; Woods, D.D.; Leveson, N. (Eds.). Resilience Engineering: Concepts and Precepts. Ashgate, Aldershot, UK.