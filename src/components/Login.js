import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  Alert,
  AlertIcon,
  Center,
  Card,
  CardBody,
  Image,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { token, user } = await response.json();
        console.log('Login response:', { token, user });

        if (!token) {
          setError('No token received.');
          return;
        }

        login(user, token);

        if (user.role === 'teacher') {
          navigate('/teacher-home');
        } else if (user.role === 'substitute') {
          navigate('/sub-home');
        } else {
          navigate('/admin-home');
        }
      } else {
        const errorResponse = await response.json();
        setError(errorResponse.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError('Cannot connect to server. Please try again.');
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={{ base: 6, sm: 10 }}>
      <Center h="100%">
        <Card maxW={{ base: '90%', sm: '450px' }} w="100%" bg={inputBg} p={8} boxShadow="xl" borderRadius="lg">
          <CardBody>
            <VStack spacing={8} align="stretch">
                <Image
                   src="/logo.png"
                   alt="School Logo"
                   maxH={{ base: '80px', sm: '100px' }}
                   mx="auto"
                   objectFit="contain"
                 />
              <Heading size="lg" textAlign="center" color={mainColor}>
                Sign In
              </Heading>
              <form onSubmit={handleManualSubmit}>
                <VStack spacing={5}>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel color={mainColor} fontWeight="semibold">
                      Email
                    </FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="someone@example.com"
                      autoComplete="email"
                      autoFocus
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    />
                  </FormControl>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel color={mainColor} fontWeight="semibold">
                      Password
                    </FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    />
                  </FormControl>
                  {error && (
                    <Alert status="error" bg={inputBg} borderRadius="md">
                      <AlertIcon color={mainColor} />
                      <Box color={mainColor}>{error}</Box>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    bgGradient="linear(to-r, rgb(175, 214, 241), rgb(100, 150, 200))"
                    color={mainColor}
                    _hover={{
                      bgGradient: 'linear(to-r, rgb(200, 230, 255), rgb(120, 170, 220))',
                      transform: 'scale(1.02)',
                    }}
                    _active={{ transform: 'scale(0.98)' }}
                    transition="all 0.2s"
                    width="full"
                    size="lg"
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Center>
    </Box>
  );
};

export default Login;