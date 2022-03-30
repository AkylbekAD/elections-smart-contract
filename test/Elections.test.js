const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Election contract", function () {

    let Elections;
    let owner;
    let acc1;
    let acc2;
    let acc3;
    let acc4;

    beforeEach(async function () {
        Elections = await ethers.getContractFactory("Elections");
        [owner, acc1, acc2, acc3, acc4] = await ethers.getSigners();
        ElectionsInterface = await Elections.deploy();
        await ElectionsInterface.deployed()
    });

    async function GetAccountBalance (address) {
        const rawBalance = await ethers.provider.getBalance(address);
        // console.log(ethers.utils.formatEther(rawBalance)); // to see in ETH
        const weiBalance = ethers.utils.formatUnits(rawBalance, 0)
        return weiBalance
    };

    async function startTestElection (name_of_election) {
        const presidentElection = await ElectionsInterface.connect(owner).startElection(name_of_election);
        await presidentElection.wait();
    };

    async function addTestCandidate (name_of_election, name_of_candidate, candidate_wallet_address) {
        const addingCandidate = await ElectionsInterface.connect(owner)
                .addCandidate(
                    name_of_election,
                    name_of_candidate,
                    candidate_wallet_address
                );
            await addingCandidate.wait();
    }

    async function testVoteForCandidate (voter, name_of_election, name_of_candidate, fee) {
        const Voting = await ElectionsInterface.connect(voter)
                    .VoteForCandidate(
                        name_of_election,
                        name_of_candidate,
                        { value: ethers.utils.parseEther(`${fee}`)}
                    );
        await Voting.wait();
    }

    async function passElectionTime () {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampBefore = blockBefore.timestamp; // finds current time in blockchain

        const electionEndTime = timestampBefore + 3 * 24 * 60 * 61;
        await ethers.provider.send('evm_setNextBlockTimestamp', [electionEndTime])
        await ethers.provider.send('evm_mine')
    }

    async function endTestElection (account, name_of_election) {
        const endElection = await ElectionsInterface.connect(account).endElectionGetWinner(name_of_election)
        endElection.wait()
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await ElectionsInterface.owner()).to.equal(owner.address);
        });
        it("Contract balance should be empty", async function () {
            expect(await ElectionsInterface.getBalance()).to.equal(0);
        })
    });

    describe("Only owner functionality", function () {
        
        it("Only owner can start an Election", async function () {
            await expect(
                ElectionsInterface.connect(acc1).startElection("Dogs or cats?")
            ).to.be.revertedWith("You are not an owner!")
        })

        it("Only owner can add candidates into Election", async function () {
            startTestElection("USA");
            await expect(
                ElectionsInterface.connect(acc2)
                    .addCandidate(
                        "USA",
                        "Biden",
                        acc2.address
                    )
            ).to.be.revertedWith("You are not an owner!")
        })

        it("Owner can not add candidate before he starts an Election", async function () {
            await expect(
                addTestCandidate("USA", "Biden", acc1.address)
            ).to.be.revertedWith("revert")
        })

    })

    describe("Public voters functionality", function () {
        beforeEach( async function () {
            startTestElection(owner, "USA");
            addTestCandidate("USA", "Biden", acc1.address)
            addTestCandidate("USA", "Trump", acc2.address)
        })

        it("View function getBalance avaliable and works well", async function () {
            const balance1 = await ElectionsInterface.connect(acc1).getBalance()
            expect(ethers.utils.formatEther(balance1)).to.equal('0.0')

            testVoteForCandidate(acc1, "USA", "Biden", 0.01)
            testVoteForCandidate(acc2, "USA", "Trump",0.01)

            const balance2 = await ElectionsInterface.connect(acc2).getBalance()

            expect(ethers.utils.formatEther(balance2)).to.equal('0.02') 
        })

        it("View function ShowCurrentResults avaliable and works well", async function () {
            const results = await ElectionsInterface.connect(acc3).showCurrentResults("USA")
            results[1][0] = ethers.utils.hexlify(results[1][0]._hex) // hexstring number to number
            results[1][1] = ethers.utils.hexlify(results[1][1]._hex)

            expect(results[0],results[1]).to.deep.equal(["Biden","Trump"],[0,0])
        })

    })
 
     describe("VoteForCandidate function test:", function () {

        beforeEach( async function () {
            startTestElection(owner, "USA");
            addTestCandidate("USA", "Biden", acc1.address)
            addTestCandidate("USA", "Trump", acc2.address)
        })

        it("Voter have to pay 0.01 ETH to vote for candidate", async function () {
            await expect(
                testVoteForCandidate(acc1, "USA", "Biden", 0.0)
                ).to.be.revertedWith("You have to pay 0.01 ETH or 10000000000000000 WEI to vote")
        })

        it("Voters can vote for candidates paying 0.01 ETH", async function () {
            testVoteForCandidate(acc1, "USA", "Biden", 0.01)
            const results = await ElectionsInterface.connect(acc1).showCurrentResults("USA")
            results[1][0] = ethers.utils.hexlify(results[1][0]._hex)
            results[1][1] = ethers.utils.hexlify(results[1][1]._hex)

            expect(results[0],results[1]).to.deep.equal(["Biden","Trump"],[1,0])
        })

        it("Voting payment of 0.01 ETH reaches to contract balance", async function () {
            testVoteForCandidate(acc1, "USA", "Biden", 0.01)
            const balance = await ElectionsInterface.connect(acc1).getBalance()

            expect(ethers.utils.formatEther(balance)).to.equal('0.01') 
        })

        it ("Same account can not vote twice in one Election", async function () {
            testVoteForCandidate(acc1, "USA", "Biden", 0.01)
            await expect(
                testVoteForCandidate(acc1, "USA", "Biden", 0.01)
                ).to.be.revertedWith("You have already voted in this Election!")
        })
    })

    describe("EndElectionGetWinner function test:", function () {
        beforeEach( async function () {
            startTestElection(owner, "USA");
            addTestCandidate("USA", "Biden", acc1.address)
            addTestCandidate("USA", "Trump", acc3.address)
            testVoteForCandidate(owner, "USA", "Trump", 0.01)
            testVoteForCandidate(acc1, "USA", "Trump",0.01)
            testVoteForCandidate(acc2, "USA", "Trump",0.01)
        })

        it("Noone can end Election before 3 days after it starts", async function () {
            await expect(
                ElectionsInterface.connect(owner).endElectionGetWinner("USA")
                ).to.be.revertedWith("This Election time does not over!")
        })

        it("Anyone can end election after 3 days and endElectionGetWinner function works well and emits winner name", async function () {
            passElectionTime()
            const result = await ElectionsInterface.connect(acc1).endElectionGetWinner("USA")
            const promise = await result.wait().then()

            expect(promise.events[0].args.name).to.equal("Trump");        
        })

        it("After Election, winner gets 90% of Election funds and 10% stays at contract balance", async function () {
            const winnerBalanceBefore = await GetAccountBalance(acc3.address).then()
            const contractBalanceBefore = await ElectionsInterface.connect(acc1).getBalance().then()
            const prize = await ElectionsInterface.connect(acc1).getBalance()/10*9
            const fee = await ElectionsInterface.connect(acc1).getBalance()/10

            await passElectionTime()
            await endTestElection(acc1, "USA")

            const winnerBalanceAfter = await GetAccountBalance(acc3.address).then()
            const contractBalanceAfter = await ElectionsInterface.connect(acc1).getBalance().then()

            expect(parseInt(contractBalanceAfter)).to.equal(parseInt(contractBalanceBefore) - prize)
            expect(contractBalanceAfter).to.equal(fee)
            expect(parseInt(winnerBalanceAfter)).to.equal(prize + parseInt(winnerBalanceBefore))
        })

    })

    describe("WithdrawFeeFunds function test:", function () {
        beforeEach( async function () {
            startTestElection(owner, "USA");
            addTestCandidate("USA", "Biden", acc1.address)
            addTestCandidate("USA", "Trump", acc3.address)
            testVoteForCandidate(acc1, "USA", "Trump", 0.01)
            testVoteForCandidate(acc2, "USA", "Trump",0.01)
            testVoteForCandidate(acc4, "USA", "Trump",0.01)
        })

        it("Only owner can withdraw fee fund", async function () {
            passElectionTime()
            endTestElection(acc1, "USA")
            await expect(
                ElectionsInterface.connect(acc2).withdrawFeeFund("USA")
            ).to.be.revertedWith("You are not an owner!")
        })

        it("Owner can not withdraw fee fund before Election time ends", async function () {
            await expect(
                ElectionsInterface.connect(owner).withdrawFeeFund("USA")
            ).to.be.revertedWith("This Election time does not over!")
        })

        it("Owner gets Election fee funds after end time", async function () {
            const fee = await ElectionsInterface.connect(acc1).getBalance()/10
            const ownerBefore = await GetAccountBalance(owner.address).then()

            await passElectionTime()
            await endTestElection(acc1, "USA")

            await ElectionsInterface.connect(owner).withdrawFeeFund("USA")

            const ownerAfter = await GetAccountBalance(owner.address).then()
            const usedGas = fee - (parseInt(ownerAfter) - parseInt(ownerBefore))
            // console.log(`Used gas = ${usedGas}`)
            
            expect(parseInt(ownerAfter)).to.equal(parseInt(ownerBefore) + fee - usedGas)
        })
    })
})