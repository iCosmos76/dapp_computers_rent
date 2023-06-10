pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ComputersRent is ERC721 {
    struct Computer {
        string name;
        address owner;
        bool isRented;
        bool isRenterPay;
        uint256 rentPricePerMinute;
        uint256 rentedUntil;
        string processor;
        uint256 memorySize;
        string graphicsCard;
        uint256 ssdCapacity;
        address renterPaymentAddress; // Адрес оплаты аренды
    }

    Computer[] public computers;
    mapping(uint256 => string) private _computerName;
    mapping(address => uint256) balances;

    uint256[] tokenIds;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) payable {}

    function mint(
        address to,
        string memory computerName_,
        uint256 rentPricePerMinute,
        string memory processor_,
        uint256 memorySize_,
        string memory graphicsCard_,
        uint256 ssdCapacity_
    ) public returns (uint256) {
        uint256 tokenId = computers.length;
        computers.push(
            Computer(
                computerName_,
                to,
                false,
                false,
                rentPricePerMinute,
                0,
                processor_,
                memorySize_,
                graphicsCard_,
                ssdCapacity_,
                address(0)
            )
        );
        _computerName[tokenId] = computerName_;
        _mint(to, tokenId);
        tokenIds.push(tokenId);
        return tokenId;
    }

    function rentByTime(uint256 tokenId, address to) public payable {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ComputersRent: not owner nor approved");
        require(computers[tokenId].isRented == false, "ComputersRent: computer is already rented");
        require(computers[tokenId].isRenterPay == true, "ComputersRent: renter has already paid");
        require(balances[to] >= computers[tokenId].rentPricePerMinute, "ComputersRent: not enough balance to pay for rent");
        require(_msgSender() != to, "ComputersRent: computer can only be rented to a specified address");

        balances[to] -= computers[tokenId].rentPricePerMinute;

        (bool success,) = computers[tokenId].owner.call{value: computers[tokenId].rentPricePerMinute}("");
        require(success, "ComputersRent: failed to send funds");

        computers[tokenId].rentedUntil = block.timestamp + 60;
        computers[tokenId].isRented = true;

        _transfer(_msgSender(), to, tokenId);
    }

    function returnFromRent(uint256 tokenId, address from) public {

        require(ownerOf(tokenId) == from, "ComputersRent: owner can't return token from yourself");
        require(computers[tokenId].isRented == true, "ComputersRent: computer is not rented");
        require(block.timestamp >= computers[tokenId].rentedUntil, "ComputersRent: rent time has not yet expired");

        computers[tokenId].isRented = false;
        computers[tokenId].isRenterPay = false;
        _transfer(from, _msgSender(), tokenId);
    }

    function isRented(uint256 tokenId) public view returns (bool) {
        return computers[tokenId].isRented;
    }

    function getComputerDetails(uint256 tokenId) public view returns (
        string memory computerName,
        address owner,
        bool isRented,
        bool isRenterPay,
        uint256 rentPricePerMinute,
        uint256 rentedUntil,
        string memory processor,
        uint256 memorySize,
        string memory graphicsCard,
        uint256 ssdCapacity,
        address renterPaymentAddress
    ) {
        require(_exists(tokenId), "ComputersRent: computer details query for nonexistent token");
        Computer storage computer = computers[tokenId];
        return (
            _computerName[tokenId],
            computer.owner,
            computer.isRented,
            computer.isRenterPay,
            computer.rentPricePerMinute,
            computer.rentedUntil,
            computer.processor,
            computer.memorySize,
            computer.graphicsCard,
            computer.ssdCapacity,
            computer.renterPaymentAddress
        );
    }

    function getAllTokenIds() public view returns (uint256[] memory) {
        return tokenIds;
    }

    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ComputersRent: not owner nor approved");

        // Получаем владельца токена
        address owner = ownerOf(tokenId);

        // Проверяем, что токен не арендован
        require(computers[tokenId].isRented == false, "ComputersRent: computer is currently rented");

        // Сжигаем токен
        _burn(tokenId);

        // Удаляем информацию о компьютере из массивов и маппингов
        delete computers[tokenId];
        delete _computerName[tokenId];

        // Обновляем массив tokenIds
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenIds[i] == tokenId) {
                // Удаляем элемент из массива, сдвигая остальные элементы на его место
                for (uint256 j = i; j < tokenIds.length - 1; j++) {
                    tokenIds[j] = tokenIds[j + 1];
                }
                tokenIds.pop();
                break;
            }
        }
    }

    function refundRent(uint256 tokenId, address paymentAddress) public {
        require(_msgSender() == ownerOf(tokenId), "ComputersRent: only token owner can refund rent");
        require(computers[tokenId].isRenterPay == true, "ComputersRent: renter has not paid");

        (bool success,) = paymentAddress.call{value: computers[tokenId].rentPricePerMinute}("");
        require(success, "ComputersRent: failed to refund rent");

        balances[paymentAddress] -= computers[tokenId].rentPricePerMinute;
        computers[tokenId].isRenterPay = false;
    }

    function payRent(uint256 tokenId) public payable {
        require(computers[tokenId].isRented == false, "ComputersRent: computer is already rented");
        require(_msgSender() != ownerOf(tokenId), "ComputersRent: owner cannot pay rent");
        require(msg.value == computers[tokenId].rentPricePerMinute, "ComputersRent: incorrect rent price");
        uint256 amount = msg.value;
        computers[tokenId].isRenterPay = true;
        computers[tokenId].renterPaymentAddress = _msgSender();
        balances[_msgSender()] += amount;
    }

    function getBalances(address to) public view returns (uint256) {
        return balances[to];
    }

    function getComputerCount() public view returns (uint256) {
        return computers.length;
    }
}
