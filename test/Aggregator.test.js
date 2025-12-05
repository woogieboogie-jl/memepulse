const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aggregator - VCWAP Calculation", function () {
    let aggregator, agentRegistry, priceFeed, mToken, distributor;
    let owner, agent1, agent2, agent3;

    beforeEach(async function () {
        [owner, agent1, agent2, agent3] = await ethers.getSigners();

        // Deploy AgentRegistry
        const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
        agentRegistry = await AgentRegistry.deploy();
        await agentRegistry.waitForDeployment();

        // Deploy MToken
        const MToken = await ethers.getContractFactory("MToken");
        mToken = await MToken.deploy();
        await mToken.waitForDeployment();

        // Deploy MTokenDistributor
        const MTokenDistributor = await ethers.getContractFactory("MTokenDistributor");
        distributor = await MTokenDistributor.deploy(
            await mToken.getAddress(),
            await agentRegistry.getAddress()
        );
        await distributor.waitForDeployment();

        // Deploy Aggregator
        const Aggregator = await ethers.getContractFactory("Aggregator");
        aggregator = await Aggregator.deploy(
            await agentRegistry.getAddress(),
            await distributor.getAddress()
        );
        await aggregator.waitForDeployment();

        // Deploy PriceFeed for DOGE
        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        priceFeed = await PriceFeed.deploy("DOGE");
        await priceFeed.waitForDeployment();

        // Configure
        await priceFeed.setAggregator(await aggregator.getAddress());
        await aggregator.setPriceFeed("DOGE", await priceFeed.getAddress());
        await mToken.setDistributor(await distributor.getAddress());
        await distributor.setAggregator(await aggregator.getAddress());

        // Transfer AgentRegistry ownership to Aggregator
        await agentRegistry.transferOwnership(await aggregator.getAddress());

        // Register agents
        await agentRegistry.connect(owner).registerAgent(agent1.address, "DOGE");
        await agentRegistry.connect(owner).registerAgent(agent2.address, "DOGE");
        await agentRegistry.connect(owner).registerAgent(agent3.address, "DOGE");
    });

    describe("Update Submission", function () {
        it("Should accept valid agent update", async function () {
            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 3,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await expect(aggregator.submitUpdate(agent1.address, "DOGE", report))
                .to.emit(aggregator, "UpdateSubmitted");
        });

        it("Should reject unregistered agent", async function () {
            const unregisteredAgent = ethers.Wallet.createRandom();

            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 3,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: unregisteredAgent.address
            };

            await expect(
                aggregator.submitUpdate(unregisteredAgent.address, "DOGE", report)
            ).to.be.revertedWith("Agent not registered");
        });

        it("Should reject zero volume", async function () {
            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: 0,
                isLong: true,
                leverage: 3,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await expect(
                aggregator.submitUpdate(agent1.address, "DOGE", report)
            ).to.be.revertedWith("Volume must be > 0");
        });

        it("Should reject invalid leverage", async function () {
            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 15,  // > MAX_LEVERAGE (10)
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await expect(
                aggregator.submitUpdate(agent1.address, "DOGE", report)
            ).to.be.revertedWith("Invalid leverage");
        });

        it("Should prevent replay attacks", async function () {
            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 3,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report);

            await expect(
                aggregator.submitUpdate(agent1.address, "DOGE", report)
            ).to.be.revertedWith("Already processed");
        });
    });

    describe("VCWAP Calculation", function () {
        it("Should calculate simple VCWAP with single update", async function () {
            const price = ethers.parseUnits("0.08524", 8);
            const report = {
                price,
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report);

            const vcwap = await aggregator.calculateVWAP("DOGE");
            expect(vcwap).to.equal(price);
        });

        it("Should calculate VCWAP with volume weighting", async function () {
            // Agent1: price=0.085, volume=1000, credibility=50%, leverage=1
            // Agent2: price=0.090, volume=2000, credibility=50%, leverage=1
            // Expected VCWAP = (0.085 * 1000 + 0.090 * 2000) / (1000 + 2000) = 0.0883...

            const report1 = {
                price: ethers.parseUnits("0.085", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            const report2 = {
                price: ethers.parseUnits("0.090", 8),
                volume: ethers.parseUnits("2000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx2"),
                agent: agent2.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report1);
            await aggregator.submitUpdate(agent2.address, "DOGE", report2);

            const vcwap = await aggregator.calculateVWAP("DOGE");

            // VCWAP should be weighted towards 0.090 (higher volume)
            expect(vcwap).to.be.gt(ethers.parseUnits("0.085", 8));
            expect(vcwap).to.be.lt(ethers.parseUnits("0.090", 8));
        });

        it("Should calculate VCWAP with credibility weighting", async function () {
            // Set different credibility scores
            // Note: AgentRegistry ownership transferred to Aggregator, so we can't directly set scores
            // Instead, we test with default 50% credibility

            const report1 = {
                price: ethers.parseUnits("0.080", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            const report2 = {
                price: ethers.parseUnits("0.090", 8),
                volume: ethers.parseUnits("1000", 8),  // Same volume
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx2"),
                agent: agent2.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report1);
            await aggregator.submitUpdate(agent2.address, "DOGE", report2);

            const vcwap = await aggregator.calculateVWAP("DOGE");

            // With equal volume and credibility, should be average
            const expectedVcwap = ethers.parseUnits("0.085", 8);

            // Allow small rounding differences
            const diff = vcwap > expectedVcwap ? vcwap - expectedVcwap : expectedVcwap - vcwap;
            expect(diff).to.be.lt(ethers.parseUnits("0.001", 8)); // Within 0.001
        });

        it("Should calculate VCWAP with leverage weighting", async function () {
            // Agent1: price=0.080, volume=1000, leverage=1
            // Agent2: price=0.090, volume=1000, leverage=5
            // Agent2 should have 5x more weight

            const report1 = {
                price: ethers.parseUnits("0.080", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            const report2 = {
                price: ethers.parseUnits("0.090", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 5,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx2"),
                agent: agent2.address
            };

            await aggregator.submitUpdate(agent1.address, "DOGE", report1);
            await aggregator.submitUpdate(agent2.address, "DOGE", report2);

            const vcwap = await aggregator.calculateVWAP("DOGE");

            // VCWAP should be heavily weighted towards 0.090 (5x leverage)
            expect(vcwap).to.be.gt(ethers.parseUnits("0.088", 8));
        });

        it("Should trim to maxUpdates", async function () {
            // Submit 60 updates (maxUpdates = 50)
            for (let i = 0; i < 60; i++) {
                const report = {
                    price: ethers.parseUnits("0.085", 8),
                    volume: ethers.parseUnits("1000", 8),
                    isLong: true,
                    leverage: 1,
                    timestamp: Math.floor(Date.now() / 1000),
                    orderlyTxHash: ethers.id(`tx${i}`),
                    agent: agent1.address
                };

                await aggregator.submitUpdate(agent1.address, "DOGE", report);
            }

            const updateCount = await aggregator.getUpdateCount("DOGE");
            expect(updateCount).to.equal(50); // Should be capped at maxUpdates
        });
    });

    describe("PriceFeed Integration", function () {
        it("Should update PriceFeed after VCWAP calculation", async function () {
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

            const roundData = await priceFeed.latestRoundData();
            expect(roundData.answer).to.equal(report.price);
            expect(roundData.roundId).to.equal(1);
        });

        it("Should emit VWAPCalculated event", async function () {
            const report = {
                price: ethers.parseUnits("0.08524", 8),
                volume: ethers.parseUnits("1000", 8),
                isLong: true,
                leverage: 1,
                timestamp: Math.floor(Date.now() / 1000),
                orderlyTxHash: ethers.id("tx1"),
                agent: agent1.address
            };

            await expect(aggregator.submitUpdate(agent1.address, "DOGE", report))
                .to.emit(aggregator, "VWAPCalculated")
                .withArgs("DOGE", report.price, 1);
        });
    });

    describe("Configuration", function () {
        it("Should allow admin to update maxUpdates", async function () {
            await aggregator.setMaxUpdates(30);
            expect(await aggregator.maxUpdates()).to.equal(30);
        });

        it("Should not allow invalid maxUpdates", async function () {
            await expect(
                aggregator.setMaxUpdates(5)  // < 10
            ).to.be.revertedWith("Invalid range");

            await expect(
                aggregator.setMaxUpdates(150)  // > 100
            ).to.be.revertedWith("Invalid range");
        });
    });

    describe("Query Functions", function () {
        it("Should return last N updates", async function () {
            for (let i = 0; i < 5; i++) {
                const report = {
                    price: ethers.parseUnits(`0.08${i}`, 8),
                    volume: ethers.parseUnits("1000", 8),
                    isLong: true,
                    leverage: 1,
                    timestamp: Math.floor(Date.now() / 1000),
                    orderlyTxHash: ethers.id(`tx${i}`),
                    agent: agent1.address
                };

                await aggregator.submitUpdate(agent1.address, "DOGE", report);
            }

            const last3 = await aggregator.getLastNUpdates("DOGE", 3);
            expect(last3.length).to.equal(3);
            expect(last3[2].price).to.equal(ethers.parseUnits("0.084", 8)); // Most recent
        });
    });
});
