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
  const [newComputerName, setNewComputerName] = useState('');
  const [newComputerProcessor, setNewComputerProcessor] = useState('');
  const [newComputerMemory, setNewComputerMemory] = useState('');
  const [newComputerGraphicsCard, setNewComputerGraphicsCard] = useState('');
  const [newComputerSSD, setNewComputerSSD] = useState('');
  const [newComputerRentPrice, setNewComputerRentPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [deleteComputerTokenId, setDeleteComputerTokenId] = useState('');
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(true);

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
      setIsDeleteButtonDisabled(isNaN(parseInt(deleteComputerTokenId)));
    }
  }, [deleteComputerTokenId]);

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
    try{  
      const web3 = new Web3(window.ethereum);
      // Создание экземпляра контракта
      const contract = new web3.eth.Contract(contractAbi, contractAddress);
      
      const tokenIdsObj = await contract.methods.getAllTokenIds().call();
      const tokenIds = objectToNumberArray(tokenIdsObj);

      const availableComputers = [];
      const rentedComputers = [];
      const pendingComputers = [];

      console.log("Токены: ", tokenIds);

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
  
  const handleAddComputer = async () => {
    try {

    if (
      !newComputerName ||
      !newComputerRentPrice ||
      !newComputerProcessor ||
      !newComputerMemory ||
      !newComputerGraphicsCard ||
      !newComputerSSD
    ) {
      return; 
    }

    const web3 = new Web3(window.ethereum);
  
    const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
  
    // Получение данных из состояний полей ввода
    const to = '0xBe9C05C3Cd1aaf66c03Ba816a9c728c4433D6AC2'; // Пример адреса получателя
    const computerName = newComputerName;
    const rentPricePerMinute = toBN(newComputerRentPrice); // Преобразование строки в число
    const processor = newComputerProcessor;
    const memorySize = parseInt(newComputerMemory); // Преобразование строки в число
    const graphicsCard = newComputerGraphicsCard;
    const ssdCapacity = parseInt(newComputerSSD); // Преобразование строки в число
  
    // Вызов функции mint
    contractInstance.methods
      .mint(
        to,
        computerName,
        rentPricePerMinute,
        processor,
        memorySize,
        graphicsCard,
        ssdCapacity
      )
      .send({ from: to })
      .then((receipt) => {
        console.log('Транзакция успешно выполнена. Receipt:', receipt);
        // Обновление списка компьютеров после успешного добавления
        loadComputersFromContract();
        loadWeb3Data();
        // Сброс значений полей ввода
        setNewComputerName('');
        setNewComputerRentPrice('');
        setNewComputerProcessor('');
        setNewComputerMemory('');
        setNewComputerGraphicsCard('');
        setNewComputerSSD('');
      })
      .catch((error) => {
        console.error('Ошибка при выполнении транзакции:', error);
      });
    } catch (error) {
      console.error('Ошибка:', error);
    }

  };

  const handleDeleteComputer = async () => {

    try {
      const web3 = new Web3(window.ethereum);
      const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
  
      const tokenId = parseInt(deleteComputerTokenId);

      const targetComputer = availableComputers.find(computer => computer.tknID === tokenId);

      if (!targetComputer) {
        alert(`В операции отказано. Вы пытаетесь удалить компьютер с активной арендой или ожидающего подтверждения аренды. ИД компьютера: ${tokenId}`);
      } else {
        await contractInstance.methods
        .burn(tokenId)
        .send({ from: walletAddress })
        .then((receipt) => {
          console.log('Транзакция успешно выполнена. Receipt:', receipt);
          // Обновление списка компьютеров после успешного удаления
          loadComputersFromContract();
          loadWeb3Data();
          // Сброс значения поля ввода
          setDeleteComputerTokenId('');
        })
        .catch((error) => {
          console.error('Ошибка при выполнении транзакции:', error);
        });
      }
  
      if (!deleteComputerTokenId) {
        return;
      }
  
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  async function handleConfirmRent(tokenId, to) {
    
    const web3 = new Web3(window.ethereum);
    const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
  
    contractInstance.methods
      .rentByTime(tokenId, to)
      .send({ from: walletAddress, value: 0 })
      .then((receipt) => {
        console.log('Транзакция успешно выполнена. Receipt:', receipt);
        loadComputersFromContract();
        loadWeb3Data();
        setDeleteComputerTokenId('');
      })
      .catch((error) => {
        console.error('Ошибка при выполнении транзакции:', error);
      });
  }

  async function handleRefundRent(tokenId, to) {
    
    const web3 = new Web3(window.ethereum);
    const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
  
    contractInstance.methods
      .refundRent(tokenId, to)
      .send({ from: walletAddress, value: 0 })
      .then((receipt) => {
        console.log('Транзакция успешно выполнена. Receipt:', receipt);
        loadComputersFromContract();
        loadWeb3Data();
        setDeleteComputerTokenId('');

        const records = JSON.parse(localStorage.getItem('refundRecords')) || [];
        records.push({ tokenId, to });
        localStorage.setItem('refundRecords', JSON.stringify(records));
      })
      .catch((error) => {
        console.error('Ошибка при выполнении транзакции:', error);
      });
  }

  async function handleReturnFromRent(tokenId, from) {
    
    const web3 = new Web3(window.ethereum);
    const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
  
    contractInstance.methods
      .returnFromRent(tokenId, from)
      .send({ from: walletAddress, value: 0 })
      .then((receipt) => {
        console.log('Транзакция успешно выполнена. Receipt:', receipt);
        loadComputersFromContract();
        loadWeb3Data();
        setDeleteComputerTokenId('');
      })
      .catch((error) => {
        console.error('Ошибка при выполнении транзакции:', error);
      });
  }


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
              onClick={handleAddComputer}
              isLoading={isLoading}
              isDisabled={
                !newComputerName ||
                !newComputerRentPrice ||
                !newComputerProcessor ||
                !newComputerMemory ||
                !newComputerGraphicsCard ||
                !newComputerSSD
              }
            >
              Добавить компьютер
            </Button>

            <Button
              colorScheme="red"
              onClick={handleDeleteComputer}
              isDisabled={isDeleteButtonDisabled}
              marginRight="-1270px"
            >
              Удалить компьютер
            </Button>
            <Input
              value={deleteComputerTokenId}
              onChange={e => setDeleteComputerTokenId(e.target.value)}
              placeholder="ID компьютера"
              style={{ width: '200px' }}
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
          <Tr>
            <Td></Td>
            <Td>
              <Input value={newComputerName} onChange={e => setNewComputerName(e.target.value)} placeholder="..." />
            </Td>
            <Td>
              <Input
                value={newComputerProcessor}
                onChange={e => setNewComputerProcessor(e.target.value)}
                placeholder="..."
              />
            </Td>
            <Td>
              <Input 
              value={newComputerMemory} 
              onChange={e => setNewComputerMemory(e.target.value)} 
              placeholder="..." 
              type="number"
              pattern="\d+" 
              title="Пожалуйста, введите число" />
            </Td>
            <Td>
              <Input
                value={newComputerGraphicsCard}
                onChange={e => setNewComputerGraphicsCard(e.target.value)}
                placeholder="..."
              />
            </Td>
            <Td>
              <Input value={newComputerSSD} 
              onChange={e => setNewComputerSSD(e.target.value)} 
              placeholder="..." 
              type="number"
              pattern="\d+" 
              title="Пожалуйста, введите число" 
              />
            </Td>
            <Td>
              <Input
                value={newComputerRentPrice}
                onChange={e => setNewComputerRentPrice(parseFloat(e.target.value, 10))}
                placeholder="..."
                pattern="\d+" 
                title="Пожалуйста, введите число"
              />
            </Td>
          </Tr>
        </Tbody>
      </Table>
      
      <Flex >
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
                    <Button colorScheme="teal" onClick={() => handleReturnFromRent(computer.tknID, computer.renterPaymentAddress)}>Вернуть из аренды</Button>
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
                  <Td>
                  <Button colorScheme="teal" onClick={() => handleConfirmRent(computer.tknID, computer.renterPaymentAddress)}>
                    Подтвердить
                  </Button>
                  <Button colorScheme="red" marginLeft='10px' width='140px' onClick={() => handleRefundRent(computer.tknID, computer.renterPaymentAddress)}>
                    Отказать
                  </Button>                     
                  </Td>
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
