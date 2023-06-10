import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';

const ErrorLogin = () => {
  const [redirectToIndex, setRedirectToIndex] = useState(false);

  if (redirectToIndex) {
    window.location.href = '/';
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Ошибка! Выполните вход в аккаунт.</h2>
      <Button mt={4} colorScheme="teal" onClick={() => setRedirectToIndex(true)}>
        Вернуться
      </Button>
    </div>
  );
};

export default ErrorLogin;