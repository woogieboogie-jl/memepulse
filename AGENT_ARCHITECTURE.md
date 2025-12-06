# MemePulse Agent Architecture

## Overview

MemePulse is an AI-powered trading agent platform that runs on AWS infrastructure. The system consists of two main components:

1. **AWS Lambda** - REST API for agent management
2. **ECS Fargate** - Container runtime for AI trading agents

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              User Dashboard                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             API Gateway (HTTP)                                │
│                          JWT Authentication                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Auth Lambdas   │      │  Agent Lambdas   │      │ Decision Lambdas │
│                  │      │                  │      │                  │
│ • /auth/message  │      │ • POST /agents   │      │ • GET decisions  │
│ • /auth/verify   │      │ • GET /agents    │      │                  │
│ • GET /me        │      │ • start/stop     │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Aurora DSQL (PostgreSQL)                           │
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────────┐          │
│  │  User   │───▶│  Agent  │───▶│ DecisionLog │    │  SubAccount  │          │
│  └─────────┘    └─────────┘    └─────────────┘    └──────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Agent Start
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              ECS Fargate Cluster                              │
│                                                                              │
│   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│   │  Agent Container   │  │  Agent Container   │  │  Agent Container   │    │
│   │  (agent-123)       │  │  (agent-456)       │  │  (agent-789)       │    │
│   │                    │  │                    │  │                    │    │
│   │  ┌──────────────┐  │  │  ┌──────────────┐  │  │  ┌──────────────┐  │    │
│   │  │  LLM Agent   │  │  │  │  LLM Agent   │  │  │  │  LLM Agent   │  │    │
│   │  │  (Claude)    │  │  │  │  (Claude)    │  │  │  │  (Claude)    │  │    │
│   │  └──────────────┘  │  │  └──────────────┘  │  │  └──────────────┘  │    │
│   └────────────────────┘  └────────────────────┘  └────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │   Orderly    │  │  Aurora DSQL │  │   MemeCore   │
          │   Network    │  │  (Decisions) │  │  Blockchain  │
          │   (Trading)  │  │              │  │              │
          └──────────────┘  └──────────────┘  └──────────────┘
```

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

```
STOPPED ──▶ STARTING ──▶ RUNNING
    ▲                        │
    │                        ▼
    └────── STOPPING ◀───────┘
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

#### List Agents (`list.ts`)
1. Fetches all agents for user
2. For each agent in transitional state, syncs with ECS
3. Returns array of agent views

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

```
┌─────────────┐
│   Trigger   │  (Timer or Twitter)
└──────┬──────┘
       │ fires
       ▼
┌─────────────┐
│  Providers  │  (Price, Position)
└──────┬──────┘
       │ gather context
       ▼
┌─────────────┐
│  LLM Agent  │  (Claude AI)
└──────┬──────┘
       │ decision (BUY/SELL/HOLD)
       ▼
┌─────────────┐
│  Executor   │  (Orderly Network)
└──────┬──────┘
       │ execute trade
       ▼
┌─────────────┐
│   Hooks     │  (Database, MemeCore)
└─────────────┘
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

## CDK Infrastructure

### Stack Structure

```
apps/cdk/lib/
├── cdk-stack.ts              # Main stack
└── compute/
    ├── ecs/
    │   └── agent-ecs-construct.ts   # ECS cluster, task definition
    └── lambda/
        ├── base-lambda.ts           # Lambda base class
        ├── agent-lambdas.ts         # Agent CRUD handlers
        └── auth-lambdas.ts          # Auth handlers
```

### Resources Created

- **VPC** with public subnets (no NAT for cost savings)
- **ECS Cluster** for running agent containers
- **ECR Repository** for agent Docker images
- **Lambda Functions** for API handlers
- **API Gateway** HTTP API with JWT authorizer
- **CloudFront + S3** for dashboard hosting

## Database Schema

```prisma
model User {
  id            Int      @id @default(autoincrement())
  walletAddress String   @map("wallet_address")
  agents        Agent[]
}

model Agent {
  id              String    @id
  userId          Int       @map("user_id")
  subAccountId    String    @map("sub_account_id")
  name            String
  symbol          String
  mode            String
  trigger         Json
  strategy        String?
  status          String
  lastHeartbeatAt DateTime? @map("last_heartbeat_at")
  user            User      @relation(...)
  decisions       DecisionLog[]
}

model DecisionLog {
  id        String   @id
  agentId   String   @map("agent_id")
  action    String
  price     Float
  qty       Float
  reasoning String?
  createdAt DateTime @map("created_at")
  agent     Agent    @relation(...)
}
```

---

## Interaction Flows

### 1. User Authentication Flow

```
┌────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  User  │     │  Dashboard  │     │ API Gateway │     │  Lambda  │
└───┬────┘     └──────┬──────┘     └──────┬──────┘     └────┬─────┘
    │                 │                   │                 │
    │  Connect Wallet │                   │                 │
    │────────────────▶│                   │                 │
    │                 │                   │                 │
    │                 │ POST /auth/message│                 │
    │                 │──────────────────▶│────────────────▶│
    │                 │                   │                 │
    │                 │      { nonce }    │                 │
    │                 │◀──────────────────│◀────────────────│
    │                 │                   │                 │
    │  Sign Message   │                   │                 │
    │◀────────────────│                   │                 │
    │                 │                   │                 │
    │   Signature     │                   │                 │
    │────────────────▶│                   │                 │
    │                 │                   │                 │
    │                 │ POST /auth/verify │                 │
    │                 │ {signature, addr} │                 │
    │                 │──────────────────▶│────────────────▶│
    │                 │                   │                 │
    │                 │   { jwt_token }   │                 │
    │                 │◀──────────────────│◀────────────────│
    │                 │                   │                 │
    │   Logged In     │                   │                 │
    │◀────────────────│                   │                 │
```

### 2. Agent Lifecycle Flow

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐     ┌───────────┐
│  User  │     │  Lambda  │     │   DSQL   │     │   ECS   │     │ Container │
└───┬────┘     └────┬─────┘     └────┬─────┘     └────┬────┘     └─────┬─────┘
    │               │                │                │                │
    │ POST /agents  │                │                │                │
    │ {name,symbol} │                │                │                │
    │──────────────▶│                │                │                │
    │               │                │                │                │
    │               │ INSERT Agent   │                │                │
    │               │ status=stopped │                │                │
    │               │───────────────▶│                │                │
    │               │                │                │                │
    │  { agent }    │                │                │                │
    │◀──────────────│                │                │                │
    │               │                │                │                │
    │ POST /start   │                │                │                │
    │──────────────▶│                │                │                │
    │               │                │                │                │
    │               │ UPDATE status  │                │                │
    │               │ = starting     │                │                │
    │               │───────────────▶│                │                │
    │               │                │                │                │
    │               │ CreateService  │                │                │
    │               │ (task def +    │                │                │
    │               │  env vars)     │                │                │
    │               │───────────────────────────────▶│                │
    │               │                │                │                │
    │               │                │                │  Pull Image   │
    │               │                │                │───────────────▶│
    │               │                │                │                │
    │               │                │                │  Run Container │
    │               │                │                │───────────────▶│
    │               │                │                │                │
    │               │                │                │                │ Heartbeat
    │               │                │◀───────────────────────────────│ (60s)
    │               │                │                │                │
    │  GET /agent   │                │                │                │
    │──────────────▶│                │                │                │
    │               │                │                │                │
    │               │ DescribeService│                │                │
    │               │───────────────────────────────▶│                │
    │               │                │                │                │
    │               │ runningCount=1 │                │                │
    │               │◀───────────────────────────────│                │
    │               │                │                │                │
    │               │ UPDATE status  │                │                │
    │               │ = running      │                │                │
    │               │───────────────▶│                │                │
    │               │                │                │                │
    │ {status:      │                │                │                │
    │  running}     │                │                │                │
    │◀──────────────│                │                │                │
```

### 3. Agent Trading Loop (Inside Container)

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ Trigger  │    │ Providers │    │   LLM    │    │ Executor │    │  Hooks  │
│ (Timer)  │    │ (Orderly) │    │ (Claude) │    │ (Orderly)│    │         │
└────┬─────┘    └─────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬────┘
     │                │               │               │               │
     │  fire (60s)    │               │               │               │
     │───────────────▶│               │               │               │
     │                │               │               │               │
     │                │ getPrice()    │               │               │
     │                │──────────────▶│               │               │
     │                │               │               │               │
     │                │ getPosition() │               │               │
     │                │──────────────▶│               │               │
     │                │               │               │               │
     │                │   Context:    │               │               │
     │                │   price,      │               │               │
     │                │   position,   │               │               │
     │                │   strategy    │               │               │
     │                │──────────────▶│               │               │
     │                │               │               │               │
     │                │               │ analyze()     │               │
     │                │               │───────────────│               │
     │                │               │               │               │
     │                │               │  Decision:    │               │
     │                │               │  BUY 0.5 DOGE │               │
     │                │               │◀──────────────│               │
     │                │               │               │               │
     │                │               │               │ placeOrder()  │
     │                │               │               │──────────────▶│
     │                │               │               │               │
     │                │               │               │  {orderId,    │
     │                │               │               │   price, qty} │
     │                │               │               │◀──────────────│
     │                │               │               │               │
     │                │               │               │  onDecision() │
     │                │               │               │──────────────▶│
     │                │               │               │               │
     │                │               │               │  • Save to DB │
     │                │               │               │  • Submit to  │
     │                │               │               │    MemeCore   │
     │                │               │               │               │
```

---

## Agent Containerization

### Docker Build Process

The agent is containerized using a multi-stage Docker build:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/agent/ ./apps/agent/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/database && pnpm prisma:generate

# Build TypeScript
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/agent/ ./apps/agent/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Run agent
CMD ["node", "apps/agent/dist/index.js"]
```

### Container Environment

Each agent container receives unique environment variables:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Container                             │
│                                                                 │
│  Environment Variables:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AGENT_ID=qo90uan8wrqzt622opi7ttyw                       │   │
│  │ ORDERLY_ACCOUNT_ID=0x1234...                            │   │
│  │ ORDERLY_PUBLIC_KEY=ed25519:...                          │   │
│  │ ORDERLY_SECRET_KEY=ed25519:...                          │   │
│  │ ANTHROPIC_API_KEY=sk-ant-...                            │   │
│  │ DSQL_ENDPOINT=xxx.dsql.ap-northeast-2.on.aws            │   │
│  │ MEMECORE_ENABLED=true                                   │   │
│  │ MEMECORE_RPC_URL=https://rpc.insectarium.memecore.net   │   │
│  │ MEMECORE_PRIVATE_KEY=0xabc...                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Running Process:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  node apps/agent/dist/index.js                          │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ AgentRunner │──│  LLMAgent   │──│  Executor   │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │         │                                               │   │
│  │         ▼                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐                      │   │
│  │  │  Heartbeat  │  │   Hooks[]   │                      │   │
│  │  │  (60s)      │  │ • Database  │                      │   │
│  │  └─────────────┘  │ • MemeCore  │                      │   │
│  │                   └─────────────┘                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### ECS Service Creation

When user clicks "Start", Lambda creates an ECS service:

```typescript
// 1. Get base task definition
const baseTaskDef = await ecs.describeTaskDefinition({
  taskDefinition: "memepulse-agent"
});

// 2. Create new task definition with agent-specific env vars
const newTaskDef = await ecs.registerTaskDefinition({
  family: "memepulse-agent",
  containerDefinitions: [{
    ...baseTaskDef.containerDefinitions[0],
    environment: [
      { name: "AGENT_ID", value: agentId },
      { name: "ORDERLY_ACCOUNT_ID", value: credentials.accountId },
      { name: "ORDERLY_PUBLIC_KEY", value: credentials.publicKey },
      { name: "ORDERLY_SECRET_KEY", value: credentials.secretKey },
      // ... more env vars
    ]
  }]
});

// 3. Create service with 1 desired task
await ecs.createService({
  cluster: "memepulse-agent-cluster",
  serviceName: agentId,  // Service name = Agent ID
  taskDefinition: newTaskDef.taskDefinitionArn,
  desiredCount: 1,
  launchType: "FARGATE",
  networkConfiguration: {
    awsvpcConfiguration: {
      subnets: ["subnet-xxx"],
      securityGroups: ["sg-xxx"],
      assignPublicIp: "ENABLED"
    }
  }
});
```

### Container Startup Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    Container Startup                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Load Configuration                                           │
│    • Read environment variables                                 │
│    • Initialize DSQL connector                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Load Agent from Database                                     │
│    • Fetch agent by AGENT_ID                                    │
│    • Get symbol, strategy, trigger config                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Initialize MemeCore (if enabled)                             │
│    • Create wallet from private key                             │
│    • Check if agent is registered                               │
│    • Register if not registered                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Initialize Orderly Client                                    │
│    • Connect to mainnet or testnet                              │
│    • Verify account balance                                     │
│    • Get current positions                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Create Agent Components                                      │
│    • Trigger (Timer or Twitter)                                 │
│    • Providers (Price, Position)                                │
│    • Executor (Orderly)                                         │
│    • Hooks (Database, MemeCore)                                 │
│    • LLM Agent (Claude)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Start Heartbeat                                              │
│    • Update lastHeartbeatAt every 60s                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Start Agent Runner                                           │
│    • Begin listening to trigger                                 │
│    • Enter trading loop                                         │
└─────────────────────────────────────────────────────────────────┘
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

