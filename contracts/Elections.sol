//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Elections {
    address public owner;
    address public electionAddress;

    mapping (string => uint) indexOfElection;

    struct Candidate {
        string name;
        uint voteCount;
        address walletAddress;
    }

    struct ElectionStruct {
        string electionName;
        string winnerOfElection;
        uint electionEndTime;
        uint electionBalance;
        Candidate[] listOfCandidates;
        mapping (address => bool) voters;
        mapping (string => uint) indexToVote;
    }

    ElectionStruct[] public AllElections;
 
    constructor() {
        owner = msg.sender;
        electionAddress = address(this);
    }

    function startElection (string memory name_of_election) public onlyOwner {
        require (indexOfElection[name_of_election] == 0, "Election with this name already exists!");
        indexOfElection[name_of_election] = AllElections.length;

        ElectionStruct storage newElectionStruct = AllElections.push();
        newElectionStruct.electionName = name_of_election;
        newElectionStruct.winnerOfElection = "none";
        newElectionStruct.electionEndTime = block.timestamp + 3 days;
        newElectionStruct.electionBalance = 0;
    }

    function addCandidate (
        string memory name_of_election,
        string memory name_of_candidate,
        address candidate_wallet_address
        ) public onlyOwner {
            require (AllElections[indexOfElection[name_of_election]].electionEndTime != 0);

            AllElections[indexOfElection[name_of_election]].indexToVote[name_of_candidate] = AllElections[indexOfElection[name_of_election]].listOfCandidates.length;
            AllElections[indexOfElection[name_of_election]].listOfCandidates.push (
                Candidate(name_of_candidate, 0, candidate_wallet_address)
            );
    }

    function VoteForCandidate (
        string memory name_of_election,
        string memory name_of_candidate
        ) payable public forVoting(name_of_election) {
            require(block.timestamp < AllElections[indexOfElection[name_of_election]].electionEndTime, "Time for this Election is out!");
            
            AllElections[indexOfElection[name_of_election]].voters[msg.sender] = true;

            payable (msg.sender).transfer(msg.value);
            AllElections[indexOfElection[name_of_election]].electionBalance = msg.value;

            uint indexOfCandidate = AllElections[indexOfElection[name_of_election]].indexToVote[name_of_candidate];
            AllElections[indexOfElection[name_of_election]].listOfCandidates[indexOfCandidate].voteCount += 1;
    }

    function showCurrentResults (string memory name_of_election) public view returns (string[] memory, uint[] memory) {
        uint lengthOfCandidatesList = AllElections[indexOfElection[name_of_election]].listOfCandidates.length;

        string[] memory names = new string[](lengthOfCandidatesList);
        uint[] memory votes = new uint[](lengthOfCandidatesList);
        
        for (uint i = 0; i < lengthOfCandidatesList; i++) {
            Candidate storage results = AllElections[indexOfElection[name_of_election]].listOfCandidates[i];
            names[i] = results.name;
            votes[i] = results.voteCount;
        }
        
        return (names, votes);
    }

    function endElectionGetWinner (string memory name_of_election) public whenElectionEnds(name_of_election) returns (string memory) {

        for (uint i = 0; i < AllElections[indexOfElection[name_of_election]].listOfCandidates.length; i++) {
            emit ElectionResults(
                AllElections[indexOfElection[name_of_election]].listOfCandidates[i].name,
                AllElections[indexOfElection[name_of_election]].listOfCandidates[i].voteCount
                );
        }

        Candidate memory winner;

        for(uint i = 0; i < AllElections[indexOfElection[name_of_election]].listOfCandidates.length; i++){
            if (AllElections[indexOfElection[name_of_election]].listOfCandidates[i].voteCount > winner.voteCount) {
                winner.voteCount = AllElections[indexOfElection[name_of_election]].listOfCandidates[i].voteCount;
                winner.name = AllElections[indexOfElection[name_of_election]].listOfCandidates[i].name;
                winner.walletAddress = AllElections[indexOfElection[name_of_election]].listOfCandidates[i].walletAddress;
            } 
        } 

        uint prize = (AllElections[indexOfElection[name_of_election]].electionBalance/10)*9;
        payable (winner.walletAddress).transfer(prize);

        return winner.name;
    }

    function withdrawFeeFunds (string memory name_of_election) public onlyOwner whenElectionEnds(name_of_election) {
        payable (owner).transfer(electionAddress.balance);
    }

    function getBalance () public view returns (uint) {
        return electionAddress.balance;
    }

    modifier forVoting (string memory name_of_election) {
        require(msg.value == 10000000000000000 wei, "You have to pay 0.01 ETH or 10000000000000000 WEI to vote");
        require(!AllElections[indexOfElection[name_of_election]].voters[msg.sender], "You have already voted in this Election!");
        _;
    }

    modifier whenElectionEnds (string memory name_of_election) {
        require(block.timestamp >= AllElections[indexOfElection[name_of_election]].electionEndTime, "This Election time does not over!");
        _;
    }

    modifier onlyOwner () {
        require(msg.sender == owner, "You`re not an owner!");
        _;
    }

    event ElectionResults (string name, uint voteCount);
}
