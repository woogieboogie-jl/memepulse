결정된 이름 **MemePulse.ai**는 프로젝트의 핵심인 "시장 감지(Sensing)"와 "오라클(Data Feed)" 기능을 직관적으로 보여주는 완벽한 네이밍입니다.

이 이름을 중심으로 브랜딩과 기획 내용을 통합하여, 즉시 개발 및 제출 가능한 **Final Master PRD**를 작성했습니다.

-----

# 📑 MASTER PRD: MemePulse.ai

### **Subtitle: The Real-time Social Oracle & PoM Mining Engine for MemeCore**

**Version:** 1.0 (Hackathon Final)
**Date:** 2025-12-02
**Project Name:** MemePulse.ai
**Target Chain:** MemeCore L1
**Core Integration:** Orderly Network (Perp DEX)

-----

## 1\. 📋 프로젝트 개요 (Executive Summary)

### 1.1. 프로젝트 정의 (Product Definition)

**MemePulse.ai**는 유저가 **AI 에이전트**를 통해 24시간 밈코인 시장을 감시하고 Orderly Network에서 자동 매매를 수행하며, 그 활동 데이터를 MemeCore 체인에 공급하여 \*\*$M 토큰을 채굴(PoM Mining)\*\*하는 \*\*"Gamified AI Trading & Oracle Platform"\*\*입니다.

### 1.2. 브랜드 아이덴티티 (Brand Identity)

  * **Name:** **MemePulse** (밈 펄스)
  * **Meaning:** "죽어있는 블록체인에 밈 시장의 \*\*실시간 맥박(Pulse)\*\*과 \*\*활력(Liquidity)\*\*을 불어넣는다."
  * **Concept:** **8-bit Retro Arcade.** 투자는 심각한 금융이 아니라, 심장이 뛰는(Pulse) 게임이라는 메시지 전달.

### 1.3. 핵심 가치 (Core Value Proposition)

1.  **For User (Dual Yield):** 트레이딩 수익(Alpha) + $M 토큰 채굴(Beta) = **손실 헷징(Hedging) 및 수익 부스팅.**
2.  **For MemeCore (Infra):** 생태계 내 부재한 **실시간 가격 및 화제성 데이터(Oracle)** 확보.
3.  **For Orderly (Liquidity):** 24/7 가동되는 AI 봇 군단을 통한 **지속적인 거래량 발생.**

-----

## 2\. ❓ 문제 정의 (Problem Statement)

### 2.1. MemeCore 생태계의 결핍 (The Void)

  * **"눈 먼 블록체인" (No Oracle):** 밈 특화 체인이지만, 정작 현재 시장(CEX/DEX)에서 밈이 얼마에 거래되는지 알 수 있는 온체인 데이터(Price Feed)가 전무함. (Chainlink는 마이너 밈코인을 지원하지 않음)
  * **"지속 불가능한 PoM":** PoM(Proof of Meme)은 관심과 기여를 증명해야 하는데, 일반 유저가 수동으로 트윗하고 커뮤니티 활동을 하는 것은 노동 집약적이며 지속 불가능함.
  * **"단절된 유동성":** 밈의 가격 형성(Price Discovery)은 체인 밖에서 일어나는데, MemeCore 체인은 이를 인지하지 못함.

### 2.2. 유저(Trader)의 고충 (Pain Points)

  * **24/7 Market Fatigue:** 밈코인 시장은 잠들지 않지만 인간은 잠을 자야 함. (FOMO 및 수면 부족)
  * **Risk of Ruin:** 변동성이 큰 밈코인 시장에서 손실은 피할 수 없음. 단순 매매 차익 외에 손실을 보전할 안전장치(Safety Net)가 필요함.

-----

## 3\. 💡 솔루션 (Solution Architecture)

**"MemePulse: AI Agent as a PoM Mining Machine"**

우리는 다음 4단계 루프(The Pulse Loop)를 통해 문제를 해결합니다.

1.  **Listen (Sensing):** AI가 트위터(KOL, AI Bot, Trend)의 맥박을 실시간 감지.
2.  **Act (Liquidity):** 시그널 포착 시 Orderly DEX에서 즉시 롱/숏 포지션을 구축하여 유동성 공급.
3.  **Prove (Oracle):** 매매 기록(Tx Hash, Price)과 소셜 화력 점수를 **MemePulse Oracle Contract**에 제출.
4.  **Reward (Mining):** MemeCore는 이 데이터를 생태계 오라클로 활용하고, 대가로 유저에게 **$M 토큰** 지급.

-----

## 4\. 👥 이해관계자 분석 (Stakeholder Analysis)

| 주체 | 역할 | Pain Point | Solution Benefit |
| :--- | :--- | :--- | :--- |
| **User** | 에이전트 배포자 | 매매 손실 공포 | **Trade-to-Earn:** AI가 대신 매매하고, 거래 행위 자체로 $M 토큰을 채굴하여 손실을 방어함. |
| **MemeCore** | L1 블록체인 | 오라클/킬러앱 부재 | **Living Oracle:** 외부의 실시간 데이터를 무료로 확보. 생태계 DApp 확장의 기반 마련. |
| **Orderly** | DEX 파트너 | 유동성/볼륨 필요 | **Liquidity Bot:** 감정 없는 AI 봇들이 24시간 수수료와 유동성을 공급함. |
| **MemePulse** | 플랫폼 (우리) | BM 필요 | **Protocol Fee:** 수익금 수수료 및 생태계 기여에 따른 Grant/Token Allocation. |

-----

## 5\. 🎨 디자인 및 UX 전략 (Design Specifications)

**Visual Theme: "8-bit Cyberpunk Arcade"**
MemePulse라는 이름에 맞춰, 심장박동(ECG) 그래프를 8-bit 스타일로 시각화합니다.

### 5.1. Visual Identity

  * **Logo:** 8-bit 픽셀로 그려진 심장(Heart) 혹은 펄스 파동(Pulse Wave).
  * **Color Palette:**
      * `#0D0D0D` (Deep Void Black - Background)
      * `#00FF41` (Matrix Green - Profit/Signal)
      * `#FF0055` (Glitch Red - Loss/Short)
      * `#F7D51D` (Coin Gold - Mining Reward)
  * **Typography:**
      * Headings: `Press Start 2P` (Retro Pixel Font)
      * Body: `Share Tech Mono` (Terminal Font)

### 5.2. Gamification Elements

  * **Agent Status UI:**
      * **Idle (대기):** 캐릭터가 눈을 감고 있고, 심박수 그래프가 평평함 (`___`).
      * **Pulse Detected (감지):** 심박수 그래프가 요동침 (`/\/\/\`).
      * **Trading (매매):** 캐릭터가 선글라스를 끼고(`Deal with it` 밈), 코인이 쏟아지는 효과.
  * **Mining Feedback:**
      * $M 토큰 채굴 시 "띠링\!" 하는 8-bit 코인 획득 사운드와 함께 `+50 M` 텍스트가 위로 떠오름 (데미지 폰트 효과).
  * **Scoreboard:**
      * PnL(수익률)과 채굴량을 금융 차트가 아닌 **"High Score" 랭킹 보드**로 표시.

-----

## 6\. 📝 상세 기능 명세 (Detailed Requirements)

### 6.1. User Frontend (Web)

  * **Landing Page:**
      * 8-bit 타이핑 효과로 "Check the Pulse of the Market." 슬로건 출력.
      * "Insert Coin (Connect Wallet)" 버튼.
  * **Agent Builder (The Setup):**
      * **Trigger Select (Pulse Source):**
          * `Elon Pulse`: 일론 머스크 트윗 감지.
          * `AI Pulse`: Truth Terminal 등 AI 봇 감지.
          * `Trend Pulse`: 키워드($SOL 등) 급등 감지.
      * **Action Logic:** Leverage (1x\~5x), Amount (USDC), Direction (Long/Short).
  * **Dashboard (Pulse Monitor):**
      * **Live Terminal:** `[PULSE DETECTED] Tweet from @elonmusk... [ACTION] Buy DOGE... [MINING] +120 $M` 로그 출력.

### 6.2. Backend System (Python/Node)

  * **Social Listener (3-Track Engine):**
      * **Track A (VIP):** Whitelisted User IDs 감시.
      * **Track B (AI):** AI Bot IDs 및 답글(Echo) 감시.
      * **Track C (Velocity):** Global Stream에서 언급량 변화율($\Delta$) 계산.
  * **Execution Module:** Orderly SDK 활용, Market Order 집행 및 `order_id`, `avg_price` 수집.
  * **Proof Generator:** 트레이딩 결과와 소셜 스코어를 결합하여 JSON Payload 생성.
  * **Signer:** EIP-712 표준에 따라 Payload를 Private Key로 서명.

-----

## 7\. ⛓️ 스마트 컨트랙트 명세 (Smart Contract Specs)

**Target:** MemeCore L1 Testnet / **Language:** Solidity

### 7.1. `AgentOracle.sol` (Data & Verification)

**역할:** 외부 데이터 검증/저장 및 Chainlink 호환 인터페이스 제공.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

contract AgentOracle is AggregatorV3Interface {
    address public trustedSigner; // 백엔드(MemePulse) 서명자 주소
    address public memeVault;     // 보상 컨트랙트

    struct OraclePayload {
        string symbol;      // e.g., "DOGE"
        int256 price;       // e.g., 42000000
        uint256 volume;     // e.g., 1000 USDC
        uint256 socialScore;// 0~100 (Pulse Score)
        uint256 timestamp;  // Execution Time
        bytes signature;    // Signed by Backend
    }

    mapping(string => int256) public latestPrices;
    mapping(string => uint256) public latestScores;

    event PulseUpdated(string symbol, int256 price, uint256 score, address agent);

    // [핵심] 에이전트가 데이터를 제출하는 함수
    function submitPulse(OraclePayload calldata payload) external {
        // 1. 서명 검증 (데이터 무결성 체크)
        bytes32 messageHash = keccak256(abi.encodePacked(
            payload.symbol, payload.price, payload.volume, payload.socialScore, payload.timestamp
        ));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address recoveredSigner = recoverSigner(ethSignedMessageHash, payload.signature);
        
        require(recoveredSigner == trustedSigner, "Invalid Pulse Signature");
        require(block.timestamp < payload.timestamp + 5 minutes, "Stale Pulse");

        // 2. 데이터 업데이트 (Oracle)
        latestPrices[payload.symbol] = payload.price;
        latestScores[payload.symbol] = payload.socialScore;

        // 3. 보상 지급 요청 (PoM Mining)
        IMemeVault(memeVault).distributeReward(msg.sender, payload.volume, payload.socialScore);
        
        emit PulseUpdated(payload.symbol, payload.price, payload.socialScore, msg.sender);
    }

    // Chainlink 호환 인터페이스 구현 (다른 DApp이 사용 가능)
    function latestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (0, latestPrices["DOGE"], 0, block.timestamp, 0);
    }
}
```

### 7.2. `MemeVault.sol` (Reward Logic)

**역할:** $M 토큰 보관 및 기여도에 따른 분배.

```solidity
contract MemeVault {
    IERC20 public mToken;
    address public oracleAddress;

    // 보상 공식: (거래량 * 펄스 점수) / 난이도
    function distributeReward(address agent, uint256 volume, uint256 score) external onlyOracle {
        uint256 rewardAmount = (volume * score) / 100; 
        mToken.transfer(agent, rewardAmount);
    }
}
```

-----

## 8\. 🛡️ 보안 및 방어 논리 (Iron-clad Defense)

### Q1. "왜 굳이 외부(Orderly)에서 거래하나요? MemeCore TVL에 도움이 안 되잖아요."

> **A. (Bridge Narrative)** "MemeCore의 철학은 \*\*'밈의 가치를 증명(PoM)'\*\*하는 것입니다. 현재 밈의 \*\*가격 발견(Price Discovery)\*\*은 체인 밖에서 일어납니다.
> **MemePulse**는 외부의 \*\*'실제 가격'\*\*과 \*\*'소셜 화력'\*\*을 MemeCore 내부로 가져오는 **Bridge Oracle**입니다. 단순한 TVL보다 더 중요한 \*\*'데이터 인프라'\*\*를 구축하여, MemeCore 위에서 진정한 DeFi가 가능하도록 돕습니다."

### Q2. "중앙화된 서버가 데이터를 서명하는데, 조작 가능성이 있지 않나요?"

> **A. (Security Roadmap)** "초기 단계(Phase 1)에서는 Trusted Signer 모델을 사용합니다.
> 하지만 로드맵 상으로는 \*\*TEE(신뢰 실행 환경)\*\*를 도입하여 AI의 추론 과정을 암호학적으로 증명(Proof of Inference)하고, **zkTLS**를 통해 트위터 데이터 원본을 검증함으로써 관리자조차 개입할 수 없는 \*\*'Trustless Oracle'\*\*로 진화할 것입니다."

### Q3. "유저가 이걸 써야 할 이유가 뭔가요?"

> **A. (Incentive)** "일반 거래소는 'Zero-sum'입니다. **MemePulse**는 \*\*'Positive-sum'\*\*입니다. 유저는 트레이딩 수익 외에 **$M 토큰 채굴**을 통해 손실을 헷징(Hedging)하고 수익을 극대화할 수 있습니다."

-----

## 9\. 📅 해커톤 워크플랜 (Implementation Roadmap)

### **Day 1: Foundation (Smart Contract & Core)**

  * **Contract:** `AgentOracle.sol` (서명 검증 포함), `MemeVault.sol` 작성 및 테스트넷 배포.
  * **Backend:** 트위터 리스너(3-Track) 기본 모듈 구현 및 Orderly API 연결.

### **Day 2: The Bridge (Integration & Signing)**

  * **Middleware:** 백엔드에서 체결 데이터를 JSON으로 패키징하고 서명(Sign)하는 로직 구현.
  * **Relayer:** 서명된 데이터를 컨트랙트로 전송(`submitPulse`)하는 모듈 구현.
  * **Asset:** **MemePulse** 로고 및 8-bit UI 에셋 제작.

### **Day 3: Frontend & Full-Cycle Test**

  * **UI Dev:** Next.js 기반 대시보드 구현 (Pixel Theme 적용).
  * **Integration:** [설정] -\> [감지] -\> [매매] -\> [채굴] 전체 루프 연동 테스트.

### **Day 4: Polish & Demo Production**

  * **UX Polish:** 채굴 애니메이션(심장박동/코인 획득), 효과음 추가.
  * **Demo Video:** 시나리오 기반 영상 촬영.
      * *Scene 1:* "일론 머스크 펄스 감지기 가동"
      * *Scene 2:* (가짜 트윗 발생) -\> "Live Terminal: PULSE DETECTED\!"
      * *Scene 3:* "Orderly 매수 체결 확인"
      * *Scene 4:* "MemeCore 익스플로러에서 가격 업데이트 및 지갑에 $M 토큰 입금 확인"

-----
