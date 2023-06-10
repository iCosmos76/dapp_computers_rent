import { useState } from 'react';
import {
  Box,
  Button,
  ChakraProvider,
  Flex,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';


function LoginForm() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLogin(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Проверка наличия логина и пароля в localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = storedUsers.find(
      (user) => user.login === login && user.password === password
    );
    if (matchedUser) {
      // Действия после успешного входа
      console.log('Login successful');
      localStorage.setItem('currentLogin', login); // Сохранение логина в хранилище
      localStorage.setItem('currentAddress', matchedUser.walletAddress);
      if (login === 'Master') {
        window.location.href = '/landlord'; // Переход на страницу landlord
      } else {
        window.location.href = '/tenant'; // Переход на страницу tenant
      }
    } else {
      // Действия при неправильном логине или пароле  
      console.log('Login failed');
      setErrorMessage('Неправильный логин или пароль');
    }
    // Сброс значений полей
    setLogin('');
    setPassword('');
  };

  return (
    <ChakraProvider>
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Box width="400px">
          <form onSubmit={handleSubmit}>
            <FormControl>
              <FormLabel>Логин</FormLabel>
              <Input
                type="text"
                value={login}
                onChange={handleLoginChange}
                placeholder="Введите логин"
              />
            </FormControl>
            <FormControl mt="4">
              <FormLabel>Пароль</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Введите пароль"
              />
            </FormControl>
            {errorMessage && <Box color="red">{errorMessage}</Box>}
            <Button type="submit" colorScheme="teal" mt="4">
              Войти
            </Button>
          </form>
          <Box mt="4">
            Нет аккаунта? <a href="/registration_form">Зарегистрируйтесь по ссылке</a>
          </Box>
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default LoginForm;
