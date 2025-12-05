const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceFeed", function () {
    let priceFeed;
    let owner, aggregator, other;

    beforeEach(async function () {
        [owner, aggregator, other] = await ethers.getSigners();

        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        priceFeed = await PriceFeed.deploy("DOGE");
        await priceFeed.waitForDeployment();

        // Set aggregator
        await priceFeed.setAggregator(aggregator.address);
    });

    describe("Deployment", function () {
        it("Should set correct symbol", async function () {
            expect(await priceFeed.symbol()).to.equal("DOGE");
        });

        it("Should have 8 decimals", async function () {
            expect(await priceFeed.decimals()).to.equal(8);
        });

        it("Should have version 1", async function () {
            expect(await priceFeed.version()).to.equal(1);
        });

        it("Should have correct description", async function () {
            expect(await priceFeed.description()).to.equal("DOGE / USD");
        });
    });

    describe("Price Updates", function () {
        it("Should allow aggregator to update price", async function () {
            const price = ethers.parseUnits("0.08524", 8);
            const timestamp = Math.floor(Date.now() / 1000);

            await priceFeed.connect(aggregator).updatePrice(price, timestamp);

            const roundData = await priceFeed.latestRoundData();
            expect(roundData.answer).to.equal(price);
            expect(roundData.roundId).to.equal(1);
        });

        it("Should not allow non-aggregator to update", async function () {
            const price = ethers.parseUnits("0.08524", 8);
            const timestamp = Math.floor(Date.now() / 1000);

            await expect(
                priceFeed.connect(other).updatePrice(price, timestamp)
            ).to.be.revertedWith("Only aggregator");
        });

        it("Should not allow zero or negative price", async function () {
            const timestamp = Math.floor(Date.now() / 1000);

            await expect(
                priceFeed.connect(aggregator).updatePrice(0, timestamp)
            ).to.be.revertedWith("Invalid price");

            await expect(
                priceFeed.connect(aggregator).updatePrice(-100, timestamp)
            ).to.be.revertedWith("Invalid price");
        });

        it("Should increment round IDs correctly", async function () {
            const price1 = ethers.parseUnits("0.08524", 8);
            const price2 = ethers.parseUnits("0.08632", 8);
            const timestamp = Math.floor(Date.now() / 1000);

            await priceFeed.connect(aggregator).updatePrice(price1, timestamp);
            await priceFeed.connect(aggregator).updatePrice(price2, timestamp);

            expect(await priceFeed.currentRoundId()).to.equal(2);

            const round2 = await priceFeed.latestRoundData();
            expect(round2.answer).to.equal(price2);
            expect(round2.roundId).to.equal(2);
        });

        it("Should emit PriceUpdated event", async function () {
            const price = ethers.parseUnits("0.08524", 8);
            const timestamp = Math.floor(Date.now() / 1000);

            await expect(priceFeed.connect(aggregator).updatePrice(price, timestamp))
                .to.emit(priceFeed, "PriceUpdated")
                .withArgs(1, price, timestamp);
        });
    });

    describe("Historical Data", function () {
        it("Should retrieve historical round data", async function () {
            const price1 = ethers.parseUnits("0.08524", 8);
            const price2 = ethers.parseUnits("0.08632", 8);
            const timestamp = Math.floor(Date.now() / 1000);

            await priceFeed.connect(aggregator).updatePrice(price1, timestamp);
            await priceFeed.connect(aggregator).updatePrice(price2, timestamp);

            const round1 = await priceFeed.getRoundData(1);
            expect(round1.answer).to.equal(price1);
            expect(round1.roundId).to.equal(1);
        });

        it("Should revert on non-existent round", async function () {
            await expect(
                priceFeed.getRoundData(999)
            ).to.be.revertedWith("Round not found");
        });
    });

    describe("Chainlink Compatibility", function () {
        it("Should return data in Chainlink format", async function () {
            const price = ethers.parseUnits("0.08524", 8);
            const timestamp = Math.floor(Date.now() / 1000);

            await priceFeed.connect(aggregator).updatePrice(price, timestamp);

            const roundData = await priceFeed.latestRoundData();

            // Check all 5 return values
            expect(roundData.roundId).to.be.gt(0);
            expect(roundData.answer).to.be.gt(0);
            expect(roundData.startedAt).to.be.gt(0);
            expect(roundData.updatedAt).to.be.gt(0);
            expect(roundData.answeredInRound).to.be.gt(0);
        });
    });
});
