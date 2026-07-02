# 💻 Finance Tracker — Frontend Web App

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React_Router-7.17-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Lucide_Icons-282C34?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide Icons" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
</div>

<br />

> Interface web moderna, altamente interativa e responsiva para o ecossistema **Finance Tracker**, oferecendo controle financeiro completo, painéis visuais de patrimônio e um **Assistente Financeiro Interativo com Inteligência Artificial**.

---

## 📋 Índice

- [✨ Funcionalidades](#-funcionalidades)
- [🚀 Tecnologias e Arquitetura](#-tecnologias-e-arquitetura)
- [🛠️ Pré-requisitos](#-pré-requisitos)
- [⚙️ Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [▶️ Como Executar](#-como-executar)
- [🧠 Experiência Interativa com IA e Assistente Financeiro](#-experiência-interativa-com-ia-e-assistente-financeiro)
- [📁 Estrutura de Diretórios](#-estrutura-de-diretórios)
- [📋 Scripts Disponíveis](#-scripts-disponíveis)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

---

## ✨ Funcionalidades

- 🎨 **UI/UX Premium e Interativa**: Interface visualmente impactante, projetada com foco em usabilidade, animações suaves, feedback instantâneo e total responsividade (Desktop, Tablet e Mobile).
- 📊 **Dashboard Consolidado**: Painel executivo com visão geral instantânea do patrimônio, saldo total das contas, fluxo de caixa do período e resumos visuais de receitas e despesas.
- 🏦 **Módulo de Contas Bancárias**: Visualização detalhada de saldos por conta corrente, carteira física ou conta de investimento, com histórico de movimentações.
- 💳 **Gestão de Cartões de Crédito**: Acompanhamento intuitivo com barras de progresso do limite total e disponível, datas de fechamento, vencimento e controle de faturas.
- 💸 **Lançamento Ágil de Transações**: Modais práticos para registrar, editar e categorizar **Receitas**, **Despesas** e **Transferências**, incluindo suporte a tags personalizadas.
- 🔄 **Assinaturas & Despesas Recorrentes**: Painel exclusivo para monitorar serviços por assinatura (streaming, mensalidades e contas fixas), prevenindo cobranças inesperadas.
- 🎯 **Metas de Economia & Orçamentos**: Acompanhamento visual em tempo real de objetivos financeiros com barras de progresso e alertas de consumo de orçamento por categoria.
- 🧠 **Experiência Interativa com IA**: Interfaces dedicadas para o Simulador Preditivo de Compras, projeção de faturas e fechamento de cartões, indicação visual do "Melhor Cartão para Hoje", feed dinâmico de insights e painel de análise de fadiga de assinaturas.
- 🔒 **Autenticação Segura & Interceptores**: Login, cadastro e controle de sessão via Token JWT embutido no `sessionStorage`, com tratamento automático de erros de autorização e redirecionamento de sessão expirada.

---

## 🚀 Tecnologias e Arquitetura

O projeto foi construído utilizando as ferramentas mais modernas do ecossistema de desenvolvimento frontend, focando em performance, tipagem estática e componentização:

- **Library Principal**: [React 18](https://react.dev/) com Hooks e Functional Components
- **Bundler & Build Tool**: [Vite 5](https://vitejs.dev/) (para inicialização instantânea e Hot Module Replacement extremamente rápido)
- **Linguagem**: [TypeScript 5](https://www.typescriptlang.org/) (garantindo segurança de tipos na comunicação com a API)
- **Roteamento**: [React Router DOM v7](https://reactrouter.com/) (gerenciamento de rotas e navegação protegida)
- **Cliente HTTP**: [Axios](https://axios-http.com/) (configurado com interceptores de request e response)
- **Ícones**: [Lucide React](https://lucide.dev/) (ícones modernos, limpos e consistentes)
- **Estilização**: CSS modular e design system customizado com foco em estética moderna e acessibilidade
- **Linting**: ESLint + TypeScript ESLint Plugin

---

## 🛠️ Pré-requisitos

Para rodar o projeto localmente, certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes: `npm`, `yarn` ou `pnpm`
- **Finance Tracker Backend** rodando localmente (normalmente na porta `8080`)

---

## ⚙️ Configuração de Variáveis de Ambiente

Por padrão, a aplicação se conecta à API local rodando em `http://localhost:8080`. Se você precisar alterar a URL base da API (por exemplo, ao rodar em produção ou no Docker), crie um arquivo `.env` (ou `.env.local`) na raiz da pasta `Finance-Tracker-Frontend`:

```env
# URL Base de conexão com o Backend Spring Boot
VITE_API_BASE_URL=http://localhost:8080
```

---

## ▶️ Como Executar

1. **Clone o repositório e acesse a pasta do frontend**:
   ```bash
   git clone https://github.com/seu-usuario/finance-tracker.git
   cd finance-tracker/Finance-Tracker-Frontend
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação no seu navegador**:
   - URL Base: `http://localhost:5173`

---

## 🧠 Experiência Interativa com IA e Assistente Financeiro

O frontend do **Finance Tracker** não se limita a exibir tabelas e números; ele transforma a inteligência artificial em uma experiência visual interativa, humanizada e acionável para o usuário:

- 🛍️ **Simulador Inteligente de Compras**: Tela dedicada onde o usuário simula uma compra desejada (ex: *Smartphone, R$ 3.500 em 10x*). Em segundos, a IA apresenta um card visual com o veredito (**Viável / Não Viável**), justificativas financeiras baseadas no saldo real e a indicação do mês ideal para realizar a compra sem estresse.
- 📊 **Projeção de Faturas e Fechamento de Cartões**: Em cada cartão da carteira, a interface apresenta uma barra de progresso visual comparando o consumo atual com a fatura estimada de fechamento, uma contagem regressiva de dias para fechar e um indicador comparativo em relação à média histórica dos últimos meses (com ícones de tendência de alta/baixa e porcentagem de desvio). Além disso, um banner comemora a "Folga de Limite" liberada por parcelamentos que chegam ao fim no mês atual.
- 💡 **Feed Proativo de Insights**: Painel dinâmico que exibe alertas e conselhos gerados pela IA (ex: aviso de fechamento em poucos dias, alerta de concentração de gastos por categoria ou sugestões personalizadas de economia).
- 💳 **Indicador do "Melhor Cartão para Hoje"**: Na tela de cartões, um componente visual recomenda exatamente qual cartão da sua carteira utilizar na compra do dia para ganhar o maior prazo de pagamento possível.
- 🔄 **Painel de Fadiga de Assinaturas**: Interface que exibe o Score de Eficiência e a essencialidade de cada serviço recorrente, destacando graficamente assinaturas subutilizadas ou que sofreram reajustes excessivos com o passar do tempo.
- 🎯 **Lista de Desejos (Wishlist)**: Acompanhamento integrado de metas de compra onde o usuário monitora quando atingirá a saúde financeira perfeita para realizar cada desejo.

---

## 📁 Estrutura de Diretórios

A estrutura do código-fonte é organizada por módulos funcionais, facilitando a manutenção e escalabilidade:

```text
src/
├── components/          # Componentes reutilizáveis de interface (Modais, Cards, Headers, Navbar, etc.)
├── hooks/               # Custom React Hooks
├── modules/             # Módulos principais da aplicação separados por domínio:
│   ├── auth/            # Telas de Login, Registro e Esqueci minha senha
│   ├── dashboard/       # Visão geral, gráficos consolidados e resumos
│   ├── contas/          # Gestão de contas bancárias e carteiras
│   ├── cartoes/         # Gestão de cartões de crédito e faturas
│   ├── transacoes/      # Lançamento de receitas, despesas e transferências
│   ├── categorias/      # Administração de categorias
│   ├── tags/            # Administração de tags
│   ├── assinaturas/     # Controle de despesas fixas e recorrentes
│   ├── metas/           # Planejamento de metas de economia
│   ├── orcamentos/      # Controle de orçamento mensal por categoria
│   ├── relatorios/      # Gráficos e análises detalhadas
│   ├── ia/              # Módulo do Assistente IA (Simulador, Insights, Fadiga e Wishlist) 🤖
│   └── usuario/         # Perfil do usuário e configurações
├── services/            # Serviços de integração com a API via Axios (api.ts, transacaoService, etc.)
├── types/               # Definições de tipos e interfaces TypeScript do domínio
├── App.tsx              # Componente raiz e configuração de rotas
└── main.tsx             # Ponto de entrada (Entrypoint) da aplicação
```

---

## 📋 Scripts Disponíveis

No diretório do frontend, você pode rodar os seguintes comandos no terminal:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com Hot Reload (porta `5173`) |
| `npm run build` | Executa o compilador do TypeScript (`tsc`) e gera o bundle otimizado para produção na pasta `dist/` |
| `npm run lint` | Roda o ESLint para verificar estilo de código e encontrar potenciais problemas no TypeScript/React |
| `npm run preview` | Inicia um servidor local para visualizar e testar o build de produção gerado na pasta `dist/` |

---

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-interface-grafica`)
3. Commit suas mudanças (`git commit -m 'feat: Cria componente visual de metas'`)
4. Push para a branch (`git push origin feature/nova-interface-grafica`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo de licença para mais detalhes.

---
<div align="center">
  Desenvolvido com ❤️ para proporcionar a melhor experiência visual em controle financeiro com IA.
</div>
