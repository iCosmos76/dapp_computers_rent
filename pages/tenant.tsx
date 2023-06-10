import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  ChakraProvider,
  Flex,
  Input,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';

import Web3 from 'web3';
import ComputersRentJSON from '../build/contracts/ComputersRent.json';
import { toBN } from 'web3-utils';

function Landlord() {
  const [login, setLogin] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);

  const [rentComputerTokenId, setRentComputerTokenId] = useState('');
  const [rentAmount, setRentAmount] = useState(0);
  const [isRentButtonDisabled, setIsRentButtonDisabled] = useState(true);

  const [availableComputers, setAvailableComputers] = useState([]);
  const [rentedComputers, setRentedComputers] = useState([]);
  const [pendingComputers, setPendingComputers] = useState([]);

  const contractAddress = '0x260fc840CF4884d147c5a3810542FA6E079a804a';
  const contractAbi = ComputersRentJSON.abi;

  useEffect(() => {
    const currentLogin = localStorage.getItem('currentLogin');
    if (!currentLogin) {
      window.location.href = '/errorlogin';
      return;
    }else{
      setLogin(currentLogin);
      loadWeb3Data();
      loadComputersFromContract();
      setIsRentButtonDisabled(
        isNaN(parseInt(rentComputerTokenId)) || isNaN(parseInt(rentAmount))
      );
    }
  }, [rentComputerTokenId, rentAmount]);

//   const changeWalletAddress = async (newAddress) => {
//     try {
//       // Проверяем, доступен ли MetaMask
//       if (window.ethereum) {
//         await window.ethereum.enable();
//         const web3 = new Web3(window.ethereum);
//         const accounts = await web3.eth.getAccounts();
//         const currentAddress = accounts[0];
//         if (currentAddress.toLowerCase() !== newAddress.toLowerCase()) {
//           // Изменяем кошелек
//           await window.ethereum.request({
//             method: 'wallet_switchEthereumChain',
//             params: [{ chainId: '0x539' }], // Идентификатор сети Ganache
//           });

//           await window.ethereum.request({
//             method: 'wallet_addEthereumChain',
//             params: [
//               {
//                 chainId: '0x539', // Идентификатор сети Ganache
//                 chainName: 'Localhost', // Название сети
//                 nativeCurrency: {
//                   name: 'Ether',
//                   symbol: 'ETH',
//                   decimals: 18,
//                 },
//                 rpcUrls: ['http://localhost:7545'], // URL-адрес RPC-сервера Ganache
//                 blockExplorerUrls: [],
//                 iconUrls: [],
//               },
//             ],
//           });

//           await window.ethereum.request({
//             method: 'wallet_switchEthereumChain',
//             params: [{ chainId: '0x539' }], // Идентификатор сети Ganache
//           });

//           // Обновляем состояние кошелька
//           setWalletAddress(newAddress);
//         }
//       } else {
//         console.error('MetaMask is not installed');
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

  const loadWeb3Data = async () => {
    const storedAddress = localStorage.getItem('currentAddress');
    if (window.ethereum) {
      await window.ethereum.enable();
      const web3 = new Web3(window.ethereum);
      setWalletAddress(storedAddress);
      const weiBalance = await web3.eth.getBalance(storedAddress);
      const etherBalance = web3.utils.fromWei(weiBalance, 'ether');
      setBalance(etherBalance);
    }
  };

  function objectToNumberArray(obj) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    return values.map(Number);
  }

  const loadComputersFromContract = async () => {
    try {
      const storedAddress = localStorage.getItem('currentAddress');
      const refundRecords = JSON.parse(localStorage.getItem('refundRecords')) || [];
      const foundRecordIndex = refundRecords.findIndex((record) => record.to === storedAddress);
      const foundRecord = refundRecords.find((record) => record.to === storedAddress);
  
      if (foundRecord) {
        const tokenId = refundRecords[foundRecordIndex].tokenId;
        alert(`В аренде компьютера с ИД ${tokenId} было отказано`);
  
        refundRecords.splice(foundRecordIndex, 1);
        localStorage.setItem('refundRecords', JSON.stringify(refundRecords));
      }

      const web3 = new Web3(window.ethereum);
      // Создание экземпляра контракта
      const contract = new web3.eth.Contract(contractAbi, contractAddress);

      const tokenIdsObj = await contract.methods.getAllTokenIds().call();
      const tokenIds = objectToNumberArray(tokenIdsObj);

      const availableComputers = [];
      const rentedComputers = [];
      const pendingComputers = [];

      console.log('Токены: ', tokenIds);

      for (let i = 0; i < tokenIds.length; i++) {
        const computer = await contract.methods.getComputerDetails(tokenIds[i]).call();

        const computerDetails = {
          tknID: tokenIds[i],
          name: computer.computerName,
          owner: computer.owner,
          isRented: computer.isRented,
          isRenterPay: computer.isRenterPay,
          rentPricePerMinute: computer.rentPricePerMinute,
          rentedUntil: computer.rentedUntil,
          processor: computer.processor,
          memorySize: computer.memorySize,
          graphicsCard: computer.graphicsCard,
          ssdCapacity: computer.ssdCapacity,
          renterPaymentAddress: computer.renterPaymentAddress
        };

        if (!computer.isRented && !computer.isRenterPay) {
          availableComputers.push(computerDetails);
        } else if (computer.isRented && computer.isRenterPay) {
          rentedComputers.push(computerDetails);
        } else if (!computer.isRented && computer.isRenterPay) {
          pendingComputers.push(computerDetails);
        }
      }

      setAvailableComputers(availableComputers);
      setRentedComputers(rentedComputers);
      setPendingComputers(pendingComputers);

    } catch (error) {
      console.error('Ошибка:', error);
    }

  };

  const handleRentComputer = async () => {
    try {

        const web3 = new Web3(window.ethereum);
        const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
    
        const tokenId = parseInt(rentComputerTokenId);
        const amount = toBN(rentAmount);
    
        const rented_c = rentedComputers.find(computer => computer.tknID === tokenId);
        const pending_c = pendingComputers.find(computer => computer.tknID === tokenId);
        const avaible_c = availableComputers.find(computer => computer.tknID === tokenId);
    
        if (rented_c || pending_c) {
            alert(`Вы пытаетесь арендовать компьютер с активной арендой или ожидающим оплаты. ИД компьютера: ${tokenId}`);
        } else if (!avaible_c){
            alert(`Вы пытаетесь арендовать компьютер, которого не существует. ИД компьютера: ${tokenId}`);
        } else {

            if (!rentComputerTokenId) {
                return;
            }

            await contractInstance
            .methods.payRent(tokenId)
            .send({ 
                from: walletAddress, 
                value: web3.utils.toWei(amount, 'wei') }
            )
            .then((receipt) => {
                console.log('Транзакция успешно выполнена. Receipt:', receipt);
                // Обновление списка компьютеров после успешного удаления
                loadComputersFromContract();
                loadWeb3Data();
                // Сброс значения поля ввода
                setDeleteComputerTokenId('');
            })
               
        }
    } catch (error) {
        console.error('Ошибка при вызове функции payRent:', error);
    }
  };
  
  function Timer({ rentedUntil }) {
    const [remainingTime, setRemainingTime] = useState(getRemainingTime);
  
    useEffect(() => {
      const timer = setInterval(() => {
        setRemainingTime(getRemainingTime());
      }, 1000);

      loadComputersFromContract();
      loadWeb3Data();
  
      return () => {
        clearInterval(timer);
      };
    }, []);
  
    function getRemainingTime() {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDifference = rentedUntil - currentTime;
  
      if (timeDifference <= 0) {
        return 0;
      }
  
      return timeDifference;
    }
  
    function formatTimer(time) {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
  
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  
    return <span>{formatTimer(remainingTime)}</span>;
  }

  function isTimeExpired(rentedUntil) {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= rentedUntil;
  }

  const handleLogout = () => {
    localStorage.removeItem("currentAddress");
    localStorage.removeItem("currentLogin");
    window.location.href = '/';
  };

  return (
    <ChakraProvider>
      <Flex justifyContent="space-between" alignItems="center" p="4">
        <Box>
          <Text fontSize="lg">Login: {login}</Text>
          <Text fontSize="lg">Wallet Address: {walletAddress}</Text>
            <Button marginTop='10px' colorScheme="red" onClick={handleLogout}>
            Выйти из аккаунта
            </Button>
        </Box>
        <Box>
          <Text fontSize="lg">Balance: {balance} ETH</Text>
        </Box>
      </Flex>
      <Flex justifyContent="space-between" p="4">
        <Button
          colorScheme="teal"
          onClick={handleRentComputer}
          isDisabled={isRentButtonDisabled}
          marginLeft="1150px"
        >
          Арендовать компьютер
        </Button>
        <Input
          value={rentComputerTokenId}
          onChange={e => setRentComputerTokenId(e.target.value)}
          placeholder="ID компьютера"
          style={{ width: '200px' }}
        />
        <Input
          value={rentAmount}
          onChange={e => setRentAmount(e.target.value)}
          placeholder="Стоимость аренды (wei)"
          style={{ width: '300px' }}
        />
      </Flex>
      <Table variant="striped" colorScheme="gray">
        <Thead>
          <Tr>
            <Th colSpan={7}>
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                Доступные в аренду
              </Text>
            </Th>
          </Tr>
          <Tr>
            <Th>Ид</Th>
            <Th>Название компьютера</Th>
            <Th>Процессор</Th>
            <Th>Память (ГБ)</Th>
            <Th>Видеокарта</Th>
            <Th>Объем SSD (ГБ)</Th>
            <Th>Цена аренды (wei)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {availableComputers.map(computer => (
            <Tr key={computer.tknID}>
              <Td>{computer.tknID}</Td>
              <Td>{computer.name}</Td>
              <Td>{computer.processor}</Td>
              <Td>{computer.memorySize}</Td>
              <Td>{computer.graphicsCard}</Td>
              <Td>{computer.ssdCapacity}</Td>
              <Td>{computer.rentPricePerMinute}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Flex>
        <Box flex="1" mr={2}>
          <Table variant="striped" colorScheme="gray" mb={4} width="100%">
            <Thead>
              <Tr>
                <Th colSpan={3}>
                  <Text fontSize="xl" fontWeight="bold">
                    В аренде
                  </Text>
                </Th>
              </Tr>
              <Tr>
                <Th>Ид</Th>
                <Th>Адрес арендатора</Th>
                <Th>Оставшееся время</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rentedComputers.map(computer => (
                <Tr key={computer.tknID}>
                  <Td>{computer.tknID}</Td>
                  <Td>{computer.renterPaymentAddress}</Td>
                  <Td>
                    {isTimeExpired(computer.rentedUntil) ? (
                        <Td>Время аренды вышло</Td>
                        ) : (
                            <Timer rentedUntil={computer.rentedUntil} />
                    )}  
                    
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        <Box flex="1" ml={2}>
          <Table variant="striped" colorScheme="gray" mb={4} width="100%">
            <Thead>
              <Tr>
                <Th colSpan={3}>
                  <Text fontSize="xl" fontWeight="bold">
                    Ожидают подтверждения
                  </Text>
                </Th>
              </Tr>
              <Tr>
                <Th>Ид</Th>
                <Th>Адрес арендатора</Th>
                <Th>Решение</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingComputers.map(computer => (
                <Tr key={computer.tknID}>
                  <Td>{computer.tknID}</Td>
                  <Td>{computer.renterPaymentAddress}</Td>
                  <Td>Ожидайте подтверждения</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Flex>

    </ChakraProvider>
  );
}

export default Landlord;
