// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * Import Libraries
 */
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

// Error declaration
error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreEth();
error RandomIpfsNft__TransferFail();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // Type declaration
    enum Waifu {
        NUMBER_ONE,
        NUMBER_TWO,
        NUMBER_THREE
    }

    /* Chainlink VRF varialbes */
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 2;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    /* States varialbes */
    uint256 private s_tokenCounter = 0;
    mapping(uint256 => address) public requestIdToAddress;
    uint256[] private s_requestIDs;
    uint256 private constant MAX_CHANCE_VALUE = 100;
    string[] internal s_waifuTokenUris;
    uint256 private immutable i_mintFee;

    /* Events */
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Waifu indexed waifu, address Minter);

    /* Functions */
    constructor(
        address vrfCoordinatorV2,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        string[3] memory waifuTokenUris,
        uint256 mintFee
    )
        VRFConsumerBaseV2(vrfCoordinatorV2)
        ERC721("Random IPFS NFT Waifu", "RINW")
    {
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        s_waifuTokenUris = waifuTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) revert RandomIpfsNft__NeedMoreEth();
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        requestIdToAddress[requestId] = msg.sender;
        s_requestIDs.push(requestId);
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address waifuOwner = requestIdToAddress[requestId];
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        Waifu waifu = getWaifuFromModdedRng(moddedRng);
        _safeMint(waifuOwner, s_tokenCounter);
        _setTokenURI(s_tokenCounter, s_waifuTokenUris[uint256(waifu)]);
        s_tokenCounter++;
        emit NftMinted(waifu, waifuOwner);
    }

    function getWaifuFromModdedRng(
        uint256 moddedRng
    ) internal pure returns (Waifu) {
        if (moddedRng <= 10) return Waifu(0);
        if (moddedRng <= 30) return Waifu(1);
        if (moddedRng <= MAX_CHANCE_VALUE) return Waifu(2);
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert RandomIpfsNft__TransferFail();
    }

    // View & pure functions
    function getGasLane() public view returns (bytes32) {
        return i_gasLane;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getMaxChanceValue() public pure returns (uint256) {
        return MAX_CHANCE_VALUE;
    }

    function getTokenURI(uint256 index) public view returns (string memory) {
        return s_waifuTokenUris[index];
    }

    function getRequestId(uint256 index) public view returns (uint256) {
        return s_requestIDs[index];
    }

    function getRequestIdOwner(
        uint256 requestId
    ) public view returns (address) {
        return requestIdToAddress[requestId];
    }
}
