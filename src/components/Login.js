import { useState, useEffect } from 'react';
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
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import logo from '../assets/logo.png';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Chair selection states
  const [chairUser, setChairUser] = useState(null);
  const [selectionOpen, setSelectionOpen] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  // Helper to navigate based on role
  const navigateBasedOnRole = (role) => {
    if (role === 'teacher') navigate('/teacher-home');
    else if (role === 'substitute') navigate('/sub-home');
    else navigate('/admin-home');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        setError(errorResponse.error || 'Invalid email or password');
        return;
      }

      const { token, user } = await response.json();

      // Check for Chair tag directly in departments
      if (user.departments && user.departments.includes('Chair')) {
        setChairUser({ ...user, token });
        setSelectionOpen(true);
        return; // exit early, do not login yet
      }

      // Normal users
      login(user, token);
      navigateBasedOnRole(user.role);

    } catch (err) {
      console.error('Fetch error:', err.message);
      setError('Cannot connect to server. Please try again.');
    }
  };

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleChairSelection = (selectedRole) => {
    if (!chairUser) return;

    // Login now with selected role
    login({ ...chairUser, role: selectedRole }, chairUser.token);
    navigateBasedOnRole(selectedRole);

    // Reset chair states
    setChairUser(null);
    setSelectionOpen(false);
  };

  // Render Chair selection UI
  if (selectionOpen && chairUser) {
    return (
      <Box minH="100vh" bg={bgColor} py={{ base: 6, sm: 10 }}>
        <Center h="100%">
          <Card maxW={{ base: '90%', sm: '450px' }} w="100%" bg={inputBg} p={8} boxShadow="xl" borderRadius="lg">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Heading size="lg" textAlign="center" color={mainColor}>
                  Chair Login Selection
                </Heading>
                <Alert status="info" bg={inputBg} borderRadius="md">
                  <AlertIcon color={mainColor} />
                  <Box color={mainColor}>
                    You have a Chair role. Select how you want to log in:
                  </Box>
                </Alert>
                <HStack spacing={4} justify="center">
                  <Button
                    colorScheme="blue"
                    onClick={() => handleChairSelection('admin')}
                  >
                    Log in as Admin
                  </Button>
                  <Button
                    colorScheme="teal"
                    onClick={() => handleChairSelection('teacher')}
                  >
                    Log in as Teacher
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Center>
      </Box>
    );
  }

  // Normal login form
  return (
    <Box minH="100vh" bg={bgColor} py={{ base: 6, sm: 10 }}>
      <Center h="100%">
        <Card maxW={{ base: '90%', sm: '450px' }} w="100%" bg={inputBg} p={8} boxShadow="xl" borderRadius="lg">
          <CardBody>
            <VStack spacing={8} align="stretch">
              <Image src={logo} alt="School Logo" />
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
