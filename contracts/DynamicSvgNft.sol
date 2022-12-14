// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error DynamicSgvNft__TokenURINotFound();

contract DynamicSvgNft is ERC721 {
    uint256 private s_tokenCounter = 0;
    string private s_lowImageURI;
    string private s_highImageURI;
    mapping(uint256 => int256) public s_tokenIdToHighValues;
    AggregatorV3Interface internal immutable i_priceFeed;

    event NftMinted(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeed,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_lowImageURI = svgToImageURI(lowSvg);
        s_highImageURI = svgToImageURI(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeed);
    }

    function mintNft(int256 highValue) public {
        s_tokenIdToHighValues[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
        emit NftMinted(s_tokenCounter, highValue);
    }

    function svgToImageURI(
        string memory svg
    ) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert DynamicSgvNft__TokenURINotFound();

        (
            ,
            /*uint80 roundID*/ int256 price /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/,
            ,
            ,

        ) = i_priceFeed.latestRoundData();

        string memory imageURI = s_lowImageURI;
        if (price >= s_tokenIdToHighValues[tokenId]) {
            imageURI = s_highImageURI;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    // View & Pure functions
    function getlowImageURI() public view returns (string memory) {
        return s_lowImageURI;
    }

    function getHighImageURI() public view returns (string memory) {
        return s_highImageURI;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return (i_priceFeed);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
