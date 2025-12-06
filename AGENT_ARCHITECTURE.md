# MemePulse Agent Architecture

## Overview

MemePulse is an AI-powered trading agent platform that runs on AWS infrastructure. The system consists of two main components:

1. **AWS Lambda** - REST API for agent management
2. **ECS Fargate** - Container runtime for AI trading agents

### System Architecture

```mermaid
graph TB
    subgraph User["User Layer"]
        Dashboard[User Dashboard]
    end
    
    subgraph API["API Gateway Layer"]
        Gateway[API Gateway - JWT Auth]
    end
    
    subgraph Lambda["Lambda Functions"]
        Auth[Auth Lambdas<br>/auth/message<br>/auth/verify<br>/me]
        Agent[Agent Lambdas<br>POST /agents<br>GET /agents<br>start/stop]
        Decision[Decision Lambdas<br>GET decisions]
    end
    
    subgraph Database["Database Layer"]
        Aurora[(Aurora DSQL)]
        UserT[User]
        AgentT[Agent]
        DecisionT[DecisionLog]
        SubAccount[SubAccount]
    end
    
    subgraph ECS["ECS Fargate Cluster"]
        Container1[Agent Container<br>LLM Agent - Claude]
        Container2[Agent Container<br>LLM Agent - Claude]
        Container3[Agent Container<br>LLM Agent - Claude]
    end
    
    subgraph External["External Services"]
        Orderly[Orderly Network<br>Trading]
        AuroraLog[Aurora DSQL<br>Decisions]
        MemeCore[MemeCore<br>Blockchain]
    end
    
    Dashboard --> Gateway
    Gateway --> Auth
    Gateway --> Agent
    Gateway --> Decision
    Auth --> Aurora
    Agent --> Aurora
    Decision --> Aurora
    UserT --> AgentT
    AgentT --> DecisionT
    Agent -->|Start Agent| ECS
    Container1 --> Orderly
    Container1 --> AuroraLog
    Container1 --> MemeCore
    Container2 --> Orderly
    Container3 --> MemeCore
```

---

## AWS Lambda (API Layer)

### Directory Structure

```
apps/aws-lambda/src/
├── _lib/                    # Shared utilities
│   ├── agent-task.ts        # ECS service management
│   └── response.ts          # API response helpers
├── agent/
│   ├── domain/
│   │   ├── agent.ts         # Agent entity
│   │   ├── agent-status.ts  # Status enum
│   │   └── agent-repository.ts
│   ├── handlers/
│   │   ├── create.ts        # POST /agents
│   │   ├── start.ts         # POST /agents/{id}/start
│   │   ├── stop.ts          # POST /agents/{id}/stop
│   │   ├── get.ts           # GET /agents/{id}
│   │   ├── list.ts          # GET /agents
│   │   └── delete.ts        # DELETE /agents/{id}
│   └── infrastructure/
│       └── prisma-agent-repository.ts
├── auth/
│   └── handlers/
│       ├── message.ts       # POST /auth/message
│       ├── verify.ts        # POST /auth/verify
│       └── jwt-authorizer.ts
├── decision/
│   └── handlers/
│       └── list.ts          # GET /agents/{id}/decisions
└── user/
    └── handlers/
        ├── get-me.ts        # GET /me
        └── register-orderly.ts
```

### Agent Status Flow

```mermaid
stateDiagram-v2
    [*] --> stopped
    stopped --> starting: Start Agent
    starting --> running: Container Ready
    running --> stopping: Stop Agent
    stopping --> stopped: Container Terminated
```

| Status | Description |
|--------|-------------|
| `stopped` | Agent is not running |
| `starting` | ECS service created, waiting for task |
| `running` | ECS task is running |
| `stopping` | ECS service being deleted |

### Key Handlers

#### Start Agent (`start.ts`)
1. Validates agent exists and is stopped
2. Gets Orderly credentials from user
3. Creates ECS service with agent-specific task definition
4. Sets status to `starting`

#### Get Agent (`get.ts`)
1. Fetches agent from database
2. If status is `starting` or `stopping`, syncs with ECS service status
3. Updates database if status changed
4. Returns agent view

---

## ECS Agent Container

### Directory Structure

```
apps/agent/src/
├── index.ts              # Entry point
├── config.ts             # Environment config loader
├── agent-loader.ts       # Load agent from database
├── heartbeat.ts          # Periodic status update
├── decision-hook.ts      # Database decision logger
└── memecore-hook.ts      # MemeCore blockchain hook
```

### Agent Packages

```
packages/
├── agent/                # Core agent logic
│   └── src/
│       ├── agent-runner.ts    # Main execution loop
│       ├── llm-agent.ts       # Claude AI integration
│       └── types.ts
├── context/              # Context providers interface
├── trigger/              # Trigger interface (timer, twitter)
├── database/             # Prisma client & connector
└── external/
    ├── orderly/          # Orderly Network integration
    │   ├── rest-client.ts
    │   ├── executor.ts
    │   ├── price-provider.ts
    │   └── position-provider.ts
    ├── twitter/          # Twitter trigger
    └── memecore/         # MemeCore blockchain
        ├── client.ts
        ├── abi.ts
        └── types.ts
```

### Execution Flow

```mermaid
flowchart TD
    A[Trigger<br>Timer/Twitter] -->|fires| B[Providers<br>Price, Position]
    B -->|gather context| C[LLM Agent<br>Claude AI]
    C -->|decision| D{Decision}
    D -->|BUY/SELL| E[Executor<br>Orderly Network]
    D -->|HOLD| F[Skip Trade]
    E -->|execute trade| G[Hooks]
    F --> G
    G --> H[Database Hook<br>Log Decision]
    G --> I[MemeCore Hook<br>Submit Oracle Update]
```

### Configuration

Environment variables passed to ECS container:

| Variable | Description |
|----------|-------------|
| `AGENT_ID` | Agent identifier |
| `ORDERLY_ACCOUNT_ID` | Orderly sub-account ID |
| `ORDERLY_PUBLIC_KEY` | Orderly API public key |
| `ORDERLY_SECRET_KEY` | Orderly API secret key |
| `ANTHROPIC_API_KEY` | Claude API key |
| `DSQL_ENDPOINT` | Aurora DSQL endpoint |
| `MEMECORE_ENABLED` | Enable MemeCore integration |
| `MEMECORE_RPC_URL` | MemeCore RPC endpoint |
| `MEMECORE_PRIVATE_KEY` | MemeCore wallet private key |

### Hooks System

Hooks are called after each decision:

```typescript
interface DecisionHook {
  onDecision(params: {
    agentId: string;
    decision: Decision;
    context: Context;
    result: ExecutionResult;
  }): Promise<void>;
}
```

**DatabaseDecisionHook**: Logs decisions to Aurora DSQL

**MemeCoreHook**: Submits price updates to MemeCore blockchain
- Converts decision to PriceReport
- Calls `submitUpdate` on Aggregator contract
- Includes price, volume, leverage, timestamp

### Heartbeat

The agent sends heartbeats every 60 seconds to update `lastHeartbeatAt` in the database. This allows the system to detect crashed agents.

---

## Interaction Flows

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant Gateway as API Gateway
    participant Lambda
    
    User->>Dashboard: Connect Wallet
    Dashboard->>Gateway: POST /auth/message
    Gateway->>Lambda: Get nonce
    Lambda-->>Dashboard: { nonce }
    Dashboard->>User: Sign Message
    User-->>Dashboard: Signature
    Dashboard->>Gateway: POST /auth/verify<br>{signature, address}
    Gateway->>Lambda: Verify signature
    Lambda-->>Dashboard: { jwt_token }
    Dashboard->>User: Logged In
```

### 2. Agent Lifecycle Flow

```mermaid
sequenceDiagram
    participant User
    participant Lambda
    participant DSQL as Aurora DSQL
    participant ECS
    participant Container
    
    User->>Lambda: POST /agents {name, symbol}
    Lambda->>DSQL: INSERT Agent (status=stopped)
    Lambda-->>User: { agent }
    
    User->>Lambda: POST /start
    Lambda->>DSQL: UPDATE status=starting
    Lambda->>ECS: CreateService (task def + env vars)
    ECS->>Container: Pull Image & Run
    
    loop Every 60s
        Container->>DSQL: Heartbeat
    end
    
    User->>Lambda: GET /agent
    Lambda->>ECS: DescribeService
    ECS-->>Lambda: runningCount=1
    Lambda->>DSQL: UPDATE status=running
    Lambda-->>User: {status: running}
```

### 3. Agent Trading Loop

```mermaid
sequenceDiagram
    participant Trigger as Trigger (60s)
    participant Providers as Providers (Orderly)
    participant LLM as LLM (Claude)
    participant Executor as Executor (Orderly)
    participant Hooks
    
    Trigger->>Providers: fire
    Providers->>Providers: getPrice()
    Providers->>Providers: getPosition()
    Providers->>LLM: Context: price, position, strategy
    LLM->>LLM: analyze()
    LLM-->>Executor: Decision: BUY 0.5 DOGE
    Executor->>Executor: placeOrder()
    Executor-->>Hooks: {orderId, price, qty}
    Hooks->>Hooks: Save to DB
    Hooks->>Hooks: Submit to MemeCore
```

---

## Container Startup Sequence

```mermaid
flowchart TD
    A[Container Start] --> B[1. Load Configuration<br>Read env vars, Init DSQL]
    B --> C[2. Load Agent from DB<br>Fetch by AGENT_ID]
    C --> D[3. Initialize MemeCore<br>Create wallet, Check registration]
    D --> E[4. Initialize Orderly<br>Connect, Verify balance]
    E --> F[5. Create Components<br>Trigger, Providers, Executor, Hooks, LLM]
    F --> G[6. Start Heartbeat<br>Update every 60s]
    G --> H[7. Start Agent Runner<br>Begin trading loop]
```

---

## Database Schema

```mermaid
erDiagram
    User ||--o{ Agent : owns
    Agent ||--o{ DecisionLog : has
    
    User {
        int id PK
        string walletAddress
    }
    
    Agent {
        string id PK
        int userId FK
        string subAccountId
        string name
        string symbol
        string mode
        json trigger
        string strategy
        string status
        datetime lastHeartbeatAt
    }
    
    DecisionLog {
        string id PK
        string agentId FK
        string action
        float price
        float qty
        string reasoning
        datetime createdAt
    }
```

---

## Deployment

### Build & Push Agent Image

```bash
# Login to ECR
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-northeast-2.amazonaws.com

# Build image
docker build --platform linux/arm64 -t <account>.dkr.ecr.ap-northeast-2.amazonaws.com/memepulse-agent:latest .

# Push image
docker push <account>.dkr.ecr.ap-northeast-2.amazonaws.com/memepulse-agent:latest
```

### Deploy CDK Stack

```bash
cd apps/cdk
npx cdk deploy
```

### Environment Variables

Set in `apps/cdk/env.json`:

```json
[
  { "DSQL_CLUSTER_ARN": "arn:aws:dsql:..." },
  { "DSQL_ENDPOINT": "xxx.dsql.ap-northeast-2.on.aws" },
  { "ANTHROPIC_API_KEY": "sk-ant-..." },
  { "MEMECORE_ENABLED": "true" },
  { "MEMECORE_RPC_URL": "https://rpc.insectarium.memecore.net" },
  { "MEMECORE_PRIVATE_KEY": "0x..." }
]
```
