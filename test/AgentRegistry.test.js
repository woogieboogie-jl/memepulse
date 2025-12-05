const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
    let agentRegistry;
    let owner, agent1, agent2, agent3;

    beforeEach(async function () {
        [owner, agent1, agent2, agent3] = await ethers.getSigners();

        const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
        agentRegistry = await AgentRegistry.deploy();
        await agentRegistry.waitForDeployment();
    });

    describe("Agent Registration", function () {
        it("Should register an agent to a feed", async function () {
            await agentRegistry.registerAgent(agent1.address, "DOGE");

            expect(await agentRegistry.isRegistered(agent1.address, "DOGE")).to.be.true;
        });

        it("Should not allow duplicate registration", async function () {
            await agentRegistry.registerAgent(agent1.address, "DOGE");

            await expect(
                agentRegistry.registerAgent(agent1.address, "DOGE")
            ).to.be.revertedWith("Already registered");
        });

        it("Should initialize credibility for new agents", async function () {
            await agentRegistry.registerAgent(agent1.address, "DOGE");

            const credibility = await agentRegistry.getCredibility(agent1.address);
            expect(credibility).to.equal(5000); // 50% default
        });

        it("Should allow registration to multiple feeds", async function () {
            await agentRegistry.registerAgent(agent1.address, "DOGE");
            await agentRegistry.registerAgent(agent1.address, "PEPE");

            expect(await agentRegistry.isRegistered(agent1.address, "DOGE")).to.be.true;
            expect(await agentRegistry.isRegistered(agent1.address, "PEPE")).to.be.true;
        });
    });

    describe("Credibility Management", function () {
        beforeEach(async function () {
            await agentRegistry.registerAgent(agent1.address, "DOGE");
        });

        it("Should record updates", async function () {
            await agentRegistry.recordUpdate(agent1.address);
            await agentRegistry.recordUpdate(agent1.address);

            const stats = await agentRegistry.getAgentStats(agent1.address);
            expect(stats.updates).to.equal(2);
        });

        it("Should update credibility based on accuracy", async function () {
            // Record 10 updates with 90% accuracy
            for (let i = 0; i < 10; i++) {
                await agentRegistry.recordUpdate(agent1.address);
                await agentRegistry.updateCredibilityFromAccuracy(agent1.address, 9000); // 90%
            }

            const credibility = await agentRegistry.getCredibility(agent1.address);
            expect(credibility).to.equal(9000); // Should be 90%
        });

        it("Should cap credibility at 100%", async function () {
            for (let i = 0; i < 10; i++) {
                await agentRegistry.recordUpdate(agent1.address);
                await agentRegistry.updateCredibilityFromAccuracy(agent1.address, 12000); // 120% (impossible)
            }

            const credibility = await agentRegistry.getCredibility(agent1.address);
            expect(credibility).to.equal(10000); // Capped at 100%
        });

        it("Should allow admin to manually set credibility", async function () {
            await agentRegistry.setCredibility(agent1.address, 7500);

            const credibility = await agentRegistry.getCredibility(agent1.address);
            expect(credibility).to.equal(7500);
        });

        it("Should not allow credibility above 100%", async function () {
            await expect(
                agentRegistry.setCredibility(agent1.address, 15000)
            ).to.be.revertedWith("Score too high");
        });
    });

    describe("Agent Statistics", function () {
        it("Should return correct agent stats", async function () {
            await agentRegistry.registerAgent(agent1.address, "DOGE");

            await agentRegistry.recordUpdate(agent1.address);
            await agentRegistry.updateCredibilityFromAccuracy(agent1.address, 8500);
            await agentRegistry.recordUpdate(agent1.address);
            await agentRegistry.updateCredibilityFromAccuracy(agent1.address, 9000);

            const stats = await agentRegistry.getAgentStats(agent1.address);
            expect(stats.updates).to.equal(2);
            expect(stats.avgAccuracy).to.equal(8750); // (8500 + 9000) / 2
        });
    });
});
