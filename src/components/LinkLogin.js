import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Card,
  CardBody,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Grid,
  GridItem,
  useToast,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../AuthContext';

const LinkLogin = () => {
  const [requestId, setRequestId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [available, setAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [subAssigned, setSubAssigned] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [blocksRequested, setBlocksRequested] = useState('');
  const [subjectRequested, setSubjectRequested] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState('');
  const [notes, setNotes] = useState('');
  const [requestExists, setRequestExists] = useState(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  const fetchAvailability = async (requestIdFromQuery) => {
    try {
      const response = await fetch(`http://localhost:3001/open-or-taken?requestId=${requestIdFromQuery}`);
      if (response.ok) {
        const data = await response.json();
        setTeacherName(data.teacher_name || '');
        setBlocksRequested(data.blocks_requested || '');
        setSubjectRequested(data.subject || '');
        setRoom(data.room || '');
        setDay(data.day || '');
        setNotes(data.notes || '');
        setAvailable(data.available || false);
        setSubAssigned(data.subs || '');
        setError('');
        toast({
          title: data.available ? 'Request Available' : 'Request Taken',
          description: data.available
            ? 'This request is available to accept.'
            : `This request is already taken by ${data.subs}.`,
          status: data.available ? 'success' : 'warning',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      } else {
        throw new Error(`Failed to fetch request status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to fetch availability.');
      toast({
        title: 'Error',
        description: 'Failed to fetch availability.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    }
  };

  useEffect(() => {
    const fetchRequestExists = async (requestIdFromQuery) => {
      try {
        const response = await fetch(`http://localhost:3001/check-request?requestId=${encodeURIComponent(requestIdFromQuery)}`);
        if (response.ok) {
          const { exists } = await response.json();
          setRequestExists(exists);
          return exists;
        }
        throw new Error('Failed to verify request existence');
      } catch (error) {
        console.error('Error checking request:', error);
        setError('Failed to verify request.');
        setRequestExists(false);
        return false;
      }
    };

    const initializePage = async () => {
      try {
        const params = new URLSearchParams(location.search);
        let tokenFromQuery = params.get('token');
        const requestIdFromQuery = params.get('requestId');

        if (!requestIdFromQuery || !tokenFromQuery) {
          setError('Request ID or token missing.');
          toast({
            title: 'Error',
            description: 'Request ID or token is missing in the URL.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
          setRequestExists(false);
          setIsLoading(false);
          return;
        }

        tokenFromQuery = decodeURIComponent(tokenFromQuery);
        console.log('Token from URL:', tokenFromQuery);

        setRequestId(requestIdFromQuery);
        setToken(tokenFromQuery);
        setHasAccepted(false);

        try {
          const decoded = jwtDecode(tokenFromQuery);
          console.log('Decoded token:', decoded);

          if (decoded.email && String(decoded.requestId) === String(requestIdFromQuery)) {
            setEmail(decoded.email);
          } else {
            throw new Error(`Invalid token payload: email or requestId mismatch. Expected requestId: ${requestIdFromQuery}, Got: ${decoded.requestId}`);
          }
        } catch (err) {
          console.error('Token decode error:', err);
          setError(`Invalid or expired token: ${err.message}`);
          toast({
            title: 'Error',
            description: `Invalid or expired token: ${err.message}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
          setRequestExists(false);
          setIsLoading(false);
          return;
        }

        const exists = await fetchRequestExists(requestIdFromQuery);
        if (exists) {
          await fetchAvailability(requestIdFromQuery);
        } else {
          toast({
            title: 'Invalid Request',
            description: 'This request does not exist.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
        }
      } catch (error) {
        console.error('Error initializing page:', error);
        setError('Failed to load request.');
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [location, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!password) {
      setError('Please enter your password.');
      toast({
        title: 'Error',
        description: 'Please enter your password.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Log in the user
      const loginResponse = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        const errorResponse = await loginResponse.json();
        const errorMsg = errorResponse.error || 'Invalid email or password';
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
        setIsLoading(false);
        return;
      }

      const { token: loginToken, user: loginUser } = await loginResponse.json();
      console.log('Login response:', { token: loginToken, user: loginUser });

      if (!loginToken || !loginUser) {
        setError('No token or user data received.');
        toast({
          title: 'Error',
          description: 'No token or user data received.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
        setIsLoading(false);
        return;
      }

      // Set user state and call login from AuthContext
      setUser(loginUser);
      login(loginUser, loginToken);

      // Step 2: Assign substitute
      const assignResponse = await fetch('http://localhost:3001/assign-substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, requestId }),
      });

      const assignData = await assignResponse.json();
      console.log('Assign substitute response:', { status: assignResponse.status, data: assignData });

      if (assignResponse.status !== 200 || !assignData.added) {
        let errorMsg = assignData.error || 'Failed to accept request';
        if (assignResponse.status === 400) {
          errorMsg = assignData.error || 'Invalid credentials or token';
        } else if (assignResponse.status === 409) {
          errorMsg = assignData.error || 'Request already taken';
        } else if (assignResponse.status === 404) {
          errorMsg = assignData.error || 'Request not found';
        }
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
        setIsLoading(false);
        return;
      }

      // Update state after successful assignment
      setSubAssigned(assignData.email);
      setHasAccepted(true);
      setAvailable(false);

      toast({
        title: 'Success',
        description: 'Request accepted and logged in successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });

      // Navigate based on user role
      if (loginUser.role === 'substitute') {
        navigate('/sub-home');
      } else if (loginUser.role === 'teacher') {
        navigate('/teacher-home');
      } else {
        navigate('/admin-home');
      }

      await fetchAvailability(requestId);
    } catch (err) {
      console.error('Network error:', err);
      const errorMsg = 'Failed to connect to server. Please try again.';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
        <Spinner size="xl" color={accentColor} />
      </Box>
    );
  }

  if (requestExists === false || !email) {
    return (
      <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }} display="flex" flexDir="column" alignItems="center">
        <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxW="lg" w="full">
          <CardBody textAlign="center">
            <Heading size="md" mb={4} color={mainColor}>
              Invalid Request
            </Heading>
            <Alert status="error" mb={4} bg={inputBg} color={mainColor}>
              <AlertIcon color={mainColor} />
              {email ? 'This request does not exist.' : 'Invalid or expired token.'}
            </Alert>
            <Button bg={accentColor} color={mainColor} _hover={{ bg: inputBg, color: mainColor }} onClick={() => navigate('/')} size="md">
              Go to Home
            </Button>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }} display="flex" flexDir="column" alignItems="center">
      {hasAccepted && subAssigned === email ? (
        <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxW="600px" w="full" mb={6}>
          <CardBody textAlign="center">
            <Heading size="md" mb={4} color={mainColor}>
              Request Accepted!
            </Heading>
            <Text mb={4} color={mainColor}>You have successfully accepted the request.</Text>
            <Button
              bg={accentColor}
              color={mainColor}
              _hover={{ bg: inputBg, color: mainColor }}
              onClick={() => navigate('/')}
              size="md"
              mt={4}
            >
              Go to Home
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxW="400px" w="full" mb={6}>
          <CardBody>
            <Heading size="lg" mb={6} textAlign="center" color={mainColor}>
              Accept Substitute Request
            </Heading>
            <VStack as="form" spacing={4} onSubmit={handleSubmit}>
              <FormControl isRequired isInvalid={!!error}>
                <FormLabel color={mainColor}>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  isDisabled={!available || isLoading}
                  bg={inputBg}
                  color={mainColor}
                  borderColor={mainColor}
                  _placeholder={{ color: mainColor }}
                />
              </FormControl>
              <Button
                type="submit"
                bg={accentColor}
                color={mainColor}
                _hover={{ bg: inputBg, color: mainColor }}
                size="lg"
                w="full"
                isDisabled={!available || isLoading}
                isLoading={isLoading}
              >
                Accept Assignment
              </Button>
              {error && (
                <Alert status="error" bg={inputBg} color={mainColor}>
                  <AlertIcon color={mainColor} />
                  {error}
                </Alert>
              )}
              {!available && subAssigned && (
                <Alert status="warning" bg={inputBg} color={mainColor}>
                  <AlertIcon color={mainColor} />
                  Request already taken by {subAssigned}.
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}
      <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxW="600px" w="full">
        <CardBody>
          <Heading size="md" mb={4} color={mainColor}>
            Request Details
          </Heading>
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
            <GridItem>
              <Text fontWeight="bold" color={mainColor}>For:</Text>
              <Text color={mainColor}>
                <strong>{teacherName}</strong>
              </Text>
            </GridItem>
            <GridItem>
              <Text fontWeight="bold" color={mainColor}>Blocks Requested:</Text>
              <Text color={mainColor}>{blocksRequested}</Text>
            </GridItem>
            <GridItem>
              <Text fontWeight="bold" color={mainColor}>Subject Requested:</Text>
              <Text color={mainColor}>{subjectRequested}</Text>
            </GridItem>
            <GridItem>
              <Text fontWeight="bold" color={mainColor}>Room:</Text>
              <Text color={mainColor}>{room}</Text>
            </GridItem>
            <GridItem>
              <Text fontWeight="bold" color={mainColor}>Day:</Text>
              <Text color={mainColor}>{day}</Text>
            </GridItem>
            <GridItem>
              <Text fontWeight="bold" color={mainColor}>Notes:</Text>
              <Text color={mainColor}>{notes}</Text>
            </GridItem>
            <GridItem colSpan={{ base: 1, sm: 2 }}>
              <Text fontWeight="bold" color={mainColor}>Availability:</Text>
              {hasAccepted && subAssigned === email ? (
                <Text color="green.500">You're signed up! - {subAssigned}</Text>
              ) : subAssigned && subAssigned !== email ? (
                <Text color="red.500">Request already taken - {subAssigned}</Text>
              ) : available ? (
                <Text color="green.500">Available</Text>
              ) : (
                <Text color="red.500">Request unavailable</Text>
              )}
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default LinkLogin;