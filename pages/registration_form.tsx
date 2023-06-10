import React, { useState } from 'react';
import {
  Box,
  Button,
  ChakraProvider,
  Flex,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import Web3 from 'web3';

interface User {
  login: string;
  walletAddress: string;
  password: string;
}

const RegistrationForm: React.FC = () => {
  const [login, setLogin] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [redirectToIndex, setRedirectToIndex] = useState(false);

  const handleRegister = async () => {
    // Проверка на совпадение пароля и повтора пароля
    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    // Проверка на уникальность логина и адреса кошелька
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(
      (user) => user.login === login || user.walletAddress === walletAddress
    );
    if (existingUser) {
      alert('Пользователь с таким логином или адресом кошелька уже существует');
      return;
    }

    // Проверка существования кошелька через MetaMask
    if (!window.ethereum) {
      alert('MetaMask не найден');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();

      if (!accounts.includes(walletAddress)) {
        alert('Указанный кошелек не существует в MetaMask');
        return;
      }
    } catch (error) {
      alert('Произошла ошибка при подключении к MetaMask');
      console.error(error);
      return;
    }

    // Сохранение нового пользователя в локальное хранилище
    const newUser: User = {
      login,
      walletAddress,
      password,
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Регистрация прошла успешно');
    // Сброс полей формы
    setLogin('');
    setWalletAddress('');
    setPassword('');
    setConfirmPassword('');
    setRedirectToIndex(true);
  };

  if (redirectToIndex) {
    window.location.href = '/';
    return null;
  }

  return (
    <ChakraProvider>
      <Flex align="center" justify="center" height="100vh">
        <Box width="400px">
          <FormControl>
            <FormLabel>Логин</FormLabel>
            <Input
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Адрес кошелька</FormLabel>
            <Input
              type="text"
              placeholder="Адрес кошелька"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Пароль</FormLabel>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Повторите пароль</FormLabel>
            <Input
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>
          <Button mt={4} colorScheme="teal" onClick={handleRegister}>
            Зарегистрироваться
          </Button>
          <Button mt={4} colorScheme="teal" onClick={() => setRedirectToIndex(true)}>
            Вернуться
          </Button>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};

export default RegistrationForm;
