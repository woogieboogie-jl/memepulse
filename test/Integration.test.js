const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration Tests - Full Flow", function () {
    let agentRegistry, priceFeed, aggregator, mToken, distributor;
    let owner, agent1, agent2, agent3;

    beforeEach(async function () {
        [owner, agent1, agent2, agent3] = await ethers.getSigners();

        // Deploy all contracts
        const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
        agentRegistry = await AgentRegistry.deploy();
        await agentRegistry.waitForDeployment();

        const MToken = await ethers.getContractFactory("MToken");
        mToken = await MToken.deploy();
        await mToken.waitForDeployment();

        const MTokenDistributor = await ethers.getContractFactory("MTokenDistributor");
        distributor = await MTokenDistributor.deploy(
            await mToken.getAddress(),
            await agentRegistry.getAddress()
        );
        await distributor.waitForDeployment();

        const Aggregator = await ethers.getContractFactory("Aggregator");
        aggregator = await Aggregator.deploy(
            await agentRegistry.getAddress(),
            await distributor.getAddress()
        );
        await aggregator.waitForDeployment();

        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        priceFeed = await PriceFeed.deploy("DOGE");
        await priceFeed.waitForDeployment();

        // Wire everything together
        await priceFeed.setAggregator(await aggregator.getAddress());
        await aggregator.setPriceFeed("DOGE", await priceFeed.getAddress());
        await mToken.setDistributor(await distributor.getAddress());
        await distributor.setAggregator(await aggregator.getAddress());
        await agentRegistry.transferOwnership(await aggregator.getAddress());
    });

    describe("Complete Oracle Update Flow", function () {
        it("Should execute full flow: register → submit → VCWAP → claim", async function () {
            // 1. Register agents
            await agentRegistry.connect(owner).registerAgent(agent1.address, "DOGE");
            await agentRegistry.connect(owner).registerAgent(agent2.address, "DOGE");

            expect(await agentRegistry.isRegistered(agent1.address, "DOGE")).to.be.true;
            expect(await agentRegistry.isRegistered(agent2.address, "DOGE")).to.be.true;

            // 2. Submit updates from both agents
            const report1 = {
                price: ethers.parseUnits("0.085", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 2,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            const report2 = {
                price: ethers.parseUnits("0.090", 8),
                volume: ethers.parseUnits("2000", 8),
                isLong: false,
                leverage: 3,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx2"),
                agent: agent2.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report1);
            await aggregator.submitUpdate(agent2.address, "DOGE", report2);

            // 3. Verify VCWAP calculated and PriceFeed updated
            const roundData = await priceFeed.latestRoundData();
            expect(roundData.answer).to.be.gt(ethers.parseUnits("0.085", 8));
            expect(roundData.answer).to.be.lt(ethers.parseUnits("0.090", 8));

            // 4. Verify contributions recorded in distributor
            const epoch = await distributor.currentEpoch();
            const stats1 = await distributor.getCurrentEpochStats(agent1.address);
            const stats2 = await distributor.getCurrentEpochStats(agent2.address);

            expect(stats1.updates).to.equal(1);
            expect(stats1.volume).to.equal(ethers.parseUnits("1000", 8));
            expect(stats2.updates).to.equal(1);
            expect(stats2.volume).to.equal(ethers.parseUnits("2000", 8));

            // 5. Advance time and start new epoch
            await time.increase(7 * 24 * 60 * 60); // 1 week
            await distributor.startNewEpoch();

            // 6. Claim rewards
            const balanceBefore1 = await mToken.balanceOf(agent1.address);
            await distributor.connect(agent1).claimRewards(epoch);
            const balanceAfter1 = await mToken.balanceOf(agent1.address);

            expect(balanceAfter1).to.be.gt(balanceBefore1);

            const balanceBefore2 = await mToken.balanceOf(agent2.address);
            await distributor.connect(agent2).claimRewards(epoch);
            const balanceAfter2 = await mToken.balanceOf(agent2.address);

            expect(balanceAfter2).to.be.gt(balanceBefore2);

            // Agent2 should get more rewards (higher volume)
            const reward1 = balanceAfter1 - balanceBefore1;
            const reward2 = balanceAfter2 - balanceBefore2;

            expect(reward2).to.be.gt(reward1);
        });
    });

    describe("Multi-Agent VCWAP Consensus", function () {
        it("Should correctly aggregate prices from 3 agents with different credibility", async function () {
            // Register 3 agents
            await agentRegistry.connect(owner).registerAgent(agent1.address, "DOGE");
            await agentRegistry.connect(owner).registerAgent(agent2.address, "DOGE");
            await agentRegistry.connect(owner).registerAgent(agent3.address, "DOGE");

            // Submit updates with different prices
            const reports = [
                {
                    price: ethers.parseUnits("0.080", 8),
                    volume: ethers.parseUnits("1000", 8),
                    leverage: 1,
                    agent: agent1.address,
                    txHash: "tx1"
                },
                {
                    price: ethers.parseUnits("0.085", 8),
                    volume: ethers.parseUnits("2000", 8),
                    leverage: 2,
                    agent: agent2.address,
                    txHash: "tx2"
                },
                {
                    price: ethers.parseUnits("0.090", 8),
                    volume: ethers.parseUnits("1500", 8),
                    leverage: 1,
                    agent: agent3.address,
                    txHash: "tx3"
                }
            ];

            for (const r of reports) {
                await aggregator.submitUpdate(r.agent, "DOGE", {
                    price: r.price,
                    volume: r.volume,
                    isLong: true,
                    leverage: r.leverage,
                    timestamp: Math.floor(Date.now() / 1000),
                    orderlyTxHash: ethers.id(r.txHash),
                    agent: r.agent
                });
            }

            // Verify VCWAP is within expected range
            const vcwap = await aggregator.calculateVWAP("DOGE");
            expect(vcwap).to.be.gte(ethers.parseUnits("0.080", 8));
            expect(vcwap).to.be.lte(ethers.parseUnits("0.090", 8));

            // PriceFeed should have the VCWAP value
            const roundData = await priceFeed.latestRoundData();
            expect(roundData.answer).to.equal(vcwap);
        });
    });

    describe("Epoch-Based Rewards Distribution", function () {
        it("Should distribute rewards proportionally over multiple epochs", async function () {
            await agentRegistry.connect(owner).registerAgent(agent1.address, "DOGE");
            await agentRegistry.connect(owner).registerAgent(agent2.address, "DOGE");

            // Epoch 1: Equal contributions
            const report1a = {
                price: ethers.parseUnits("0.085", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1a"),
                agent: agent1.address
            };

            const report2a = {
                price: ethers.parseUnits("0.086", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx2a"),
                agent: agent2.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report1a);
            await aggregator.submitUpdate(agent2.address, "DOGE", report2a);

            // Advance to epoch 2
            await time.increase(7 * 24 * 60 * 60);
            await distributor.startNewEpoch();

            // Epoch 2: Unequal contributions (agent1 = 3x agent2)
            for (let i = 0; i < 3; i++) {
                await aggregator.submitUpdate(agent1.address, "DOGE", {
                    price: ethers.parseUnits("0.087", 8),
                    volume: ethers.parseUnits("1000", 8),
                    isLong: true,
                    leverage: 1,
                    timestamp: Math.floor(Date.now() / 1000),
                    orderlyTxHash: ethers.id(`tx1b${i}`),
                    agent: agent1.address
                });
            }

            await aggregator.submitUpdate(agent2.address, "DOGE", {
                price: ethers.parseUnits("0.088", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx2b"),
                agent: agent2.address
            });

            // Advance to epoch 3
            await time.increase(7 * 24 * 60 * 60);
            await distributor.startNewEpoch();

            // Claim epoch 1 rewards (should be equal)
            await distributor.connect(agent1).claimRewards(1);
            await distributor.connect(agent2).claimRewards(1);

            const epoch1Reward1 = await mToken.balanceOf(agent1.address);
            const epoch1Reward2 = await mToken.balanceOf(agent2.address);

            // Should be roughly equal (allow small rounding)
            const diff1 = epoch1Reward1 > epoch1Reward2
                ? epoch1Reward1 - epoch1Reward2
                : epoch1Reward2 - epoch1Reward1;

            expect(diff1).to.be.lt(ethers.parseEther("100")); // Within 100 M tokens

            // Claim epoch 2 rewards (agent1 should get ~3x agent2)
            await distributor.connect(agent1).claimRewards(2);
            await distributor.connect(agent2).claimRewards(2);

            const totalReward1 = await mToken.balanceOf(agent1.address);
            const totalReward2 = await mToken.balanceOf(agent2.address);

            const epoch2Reward1 = totalReward1 - epoch1Reward1;
            const epoch2Reward2 = totalReward2 - epoch1Reward2;

            // Agent1 should get significantly more in epoch 2
            expect(epoch2Reward1).to.be.gt(epoch2Reward2 * 2n);
        });
    });

    describe("Chainlink Consumer Integration", function () {
        it("Should allow external contract to read latest price", async function () {
            // Register and submit update
            await agentRegistry.connect(owner).registerAgent(agent1.address, "DOGE");

            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report);

            // External contract reads price
            const roundData = await priceFeed.latestRoundData();

            expect(roundData.roundId).to.equal(1);
            expect(roundData.answer).to.equal(report.price);
            expect(roundData.updatedAt).to.be.gt(0);
        });
    });
});
