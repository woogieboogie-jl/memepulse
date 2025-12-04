# 📚 MemePulse.ai Development References

이 문서는 **MemePulse.ai** 프로젝트(AI-Powered PoM Miner & Oracle) 개발을 위한 핵심 기술 문서 및 레퍼런스 모음입니다. 개발 에이전트 및 팀원은 이 리소스를 참조하여 구현의 정확도를 높이십시오.

---

## 1. 🏗️ MemeCore & PoM (Target Ecosystem)
*핵심 컨셉: 소셜 활동과 기여도를 블록체인 합의/보상으로 연결*

* **Proof of Meme (PoM) Concept (IQ Wiki)**
    * [IQ Wiki: Proof of Meme](https://iq.wiki/wiki/proof-of-meme)
    * *참조:* PoM의 작동 원리와 '관심(Attention) 기반 합의'에 대한 이론적 배경.
* **Social Mining Logic (Reference)**
    * [DAO Maker Social Mining](https://daomaker.com/social-mining)
    * *참조:* 오프체인 활동(소셜 미디어)을 온체인 보상으로 환산하는 로직 레퍼런스.
* **MemeCore Official Docs**
    * *(해커톤 주최 측 공식 문서 링크로 대체 필요)*

## 2. 📈 Orderly Network (Execution Layer)
*핵심 컨셉: AI 에이전트가 실제로 유동성을 공급하고 매매를 집행하는 곳*

* **Orderly Network Documentation (Home)**
    * [Orderly Docs](https://orderly.network/docs)
    * *참조:* 전체 아키텍처 및 EVM 연동 방식 이해.
* **Python SDK (For Backend Agent)**
    * [GitHub: orderly-sdk-python](https://github.com/OrderlyNetwork/orderly-sdk-python)
    * *필수:* 백엔드에서 `Client` 초기화, 주문 생성(`create_order`), 포지션 조회(`get_position`) 구현 시 사용.
* **REST API Reference**
    * [Orderly EVM API Docs](https://orderly.network/docs/build-on-evm/evm-api/rest-api)
    * *참조:* SDK 미지원 기능 구현 시 직접 HTTP 요청을 보낼 엔드포인트 확인.

## 3. 🔗 Oracle & Smart Contract (Bridge Layer)
*핵심 컨셉: 오프체인 데이터(트레이딩+소셜)를 온체인으로 안전하게 전달*

* **Chainlink AggregatorV3Interface (Standard)**
    * [Chainlink Data Feeds API](https://docs.chain.link/data-feeds/api-reference)
    * *필수:* `AgentOracle.sol` 작성 시 이 인터페이스를 구현(Implement)해야 외부 DApp 호환성 확보 가능.
* **EIP-712 (Typed Data Signing)**
    * [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
    * *필수:* 백엔드(Signer)에서 데이터 패킷을 서명하고, 컨트랙트에서 `ecrecover`로 검증하기 위한 표준.
* **OpenZeppelin ECDSA Library**
    * [OpenZeppelin Docs: ECDSA](https://docs.openzeppelin.com/contracts/4.x/api/utils#ECDSA)
    * *참조:* 솔리디티 내에서 서명 복구를 안전하게 구현하기 위한 라이브러리.

## 4. 🤖 AI Agent & Data Ingestion (Sensing Layer)
*핵심 컨셉: 트위터 데이터 수집 및 봇 감지*

* **Tweepy (Twitter API Wrapper)**
    * [Tweepy Documentation](https://docs.tweepy.org/en/stable/)
    * *필수:* Python 기반 트위터 데이터 스트리밍 및 검색 구현.
* **Truth Terminal (Meta Reference)**
    * [X Account: @truth_terminal](https://x.com/truth_terminal)
    * *참조:* 현재 AI 밈코인 메타를 주도하는 봇의 트윗 패턴 및 상호작용 방식 분석용.

## 5. 🛡️ Security & Roadmap (Defense Logic)
*핵심 컨셉: 중앙화된 서명 방식을 탈중앙화된 신뢰 기술로 발전시키는 로드맵*

* **AWS Nitro Enclaves (TEE)**
    * [AWS Nitro Enclaves Docs](https://aws.amazon.com/ec2/nitro/nitro-enclaves/)
    * *참조:* Phase 2 로드맵. 관리자도 접근 불가능한 격리 환경에서 AI 추론 및 서명 수행.
* **Reclaim Protocol (zkTLS)**
    * [Reclaim Protocol](https://www.reclaimprotocol.org/)
    * *참조:* Phase 3 로드맵. 트위터 웹사이트의 데이터가 조작되지 않았음을 영지식(ZK)으로 증명하는 기술.

## 6. 🎨 Design & UI (Frontend Vibe)
*핵심 컨셉: 8-bit Retro Arcade, Gamification*

* **Google Fonts (Retro Style)**
    * [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (제목/수치용)
    * [VT323](https://
