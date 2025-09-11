import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Spinner,
  useToast,
  Tooltip,
  Icon,
  Container,
  VStack,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const TeacherHome = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/teacher-requests?teacherId=${encodeURIComponent(user.id)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          // Filter out completed requests
          setRequests(
            data
              .filter(req => req.status !== 'completed')
              .map(req => ({ ...req, status: req.status || 'uncompleted' }))
          );
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch requests.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
            description: 'Error fetching requests.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user, isAuthenticated, navigate, toast]);

    const handleCancel = async (requestId) => {
      try {
        const response = await fetch(`http://localhost:3001/requests/${requestId}/cancel`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherId: user.id }),
        });
        if (response.ok) {
          setRequests(prev => prev.filter(req => req.id !== requestId));
          toast({
            title: 'Success',
            description: 'Request cancelled.',
            status: 'success',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
        } else {
          const error = await response.json();
          toast({
            title: 'Error',
            description: error.error || 'Failed to cancel request.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            bg: inputBg,
            color: mainColor,
          });
        }
      } catch (error) {
        console.error('Error cancelling request:', error);
        toast({
          title: 'Error',
          description: 'Failed to cancel request. Try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      }
    };

    const handleDismiss = (requestId) => {
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'Success',
        description: 'Request dismissed.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    };

    const handleSchedule = () => {
      navigate('/teacher-scheduler');
    };

    if (loading) {
      return (
        <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
          <Spinner size="xl" color={accentColor} />
        </Box>
      );
    }

    return (
      <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
        <Container maxW="container.2xl">
          <Card bg={inputBg} boxShadow="xl" borderRadius="lg" mb={6}>
            <CardBody>
              <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
                <Heading size="xl" color={mainColor}>
                  Hello {user.first_name} {user.last_name}!
                </Heading>
                <HStack spacing={3}>
                  <Button
                    bgGradient="linear(to-r, rgb(175, 214, 241), rgb(100, 150, 200))"
                    color={mainColor}
                    _hover={{ bgGradient: 'linear(to-r, rgb(200, 230, 255), rgb(120, 170, 220))', transform: 'scale(1.02)' }}
                    _active={{ transform: 'scale(0.98)' }}
                    transition="all 0.2s"
                    onClick={handleSchedule}
                    size="md"
                  >
                    Schedule Substitute
                  </Button>
                  <Button
                    bg={accentColor}
                    color={mainColor}
                    _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }}
                    transition="all 0.2s"
                    onClick={logout}
                    size="md"
                  >
                    Logout
                  </Button>
                </HStack>
              </HStack>
            </CardBody>
          </Card>
          <Card bg={inputBg} boxShadow="xl" borderRadius="lg">
            <CardBody>
              <Heading size="md" mb={4} textAlign="center" color={mainColor}>
                Your Substitute Requests
              </Heading>
              <Box overflowX="auto">
                <Table variant="simple" bg={inputBg} borderRadius="md" size="sm">
                  <Thead bg={accentColor}>
                    <Tr>
                      <Th color={mainColor} width="10%" whiteSpace="nowrap">
                        Date (Y/M/D)
                      </Th>
                      <Th color={mainColor} width="10%" whiteSpace="nowrap">
                        Room
                      </Th>
                      <Th color={mainColor} width="10%" whiteSpace="nowrap">
                        Subject
                      </Th>
                      <Th color={mainColor} width="25%" minWidth="200px">
                        Blocks Requested
                      </Th>
                      <Th color={mainColor} width="10%" whiteSpace="nowrap">
                        Notes
                      </Th>
                      <Th color={mainColor} width="15%" whiteSpace="nowrap">
                        Substitute
                      </Th>
                      <Th color={mainColor} width="10%" whiteSpace="nowrap">
                        Status
                      </Th>
                      <Th color={mainColor} width="15%" whiteSpace="nowrap">
                        Action
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {requests.length > 0 ? (
                      requests.map(request => {
                        const blocks = request.blocks_requested
                          ? request.blocks_requested.split(',').map(block => block.trim())
                          : [];
                        return (
                          <Tr key={request.id}>
                            <Td color={mainColor} whiteSpace="nowrap">
                              {request.day}
                            </Td>
                            <Td color={mainColor}>{request.room}</Td>
                            <Td color={mainColor}>{request.subject || '-'}</Td>
                            <Td color={mainColor}>
                              {blocks.length > 0 ? (
                                <UnorderedList spacing={1}>
                                  {blocks.map((block, index) => (
                                    <ListItem key={index} fontSize="14px">
                                      {block}
                                    </ListItem>
                                  ))}
                                </UnorderedList>
                              ) : (
                                <Text>-</Text>
                              )}
                            </Td>
                            <Td>
                              <Tooltip
                                label={request.notes || 'No notes'}
                                hasArrow
                                placement="top"
                                maxW="300px"
                                bg={inputBg}
                                color={mainColor}
                              >
                                <Button
                                  variant="link"
                                  color={mainColor}
                                  size="sm"
                                  _hover={{ color: accentColor }}
                                >
                                  View Notes
                                </Button>
                              </Tooltip>
                            </Td>
                            <Td color={mainColor}>
                              {request.sub_first_name
                                ? `${request.sub_first_name} ${request.sub_last_name}`
                                : '-'}
                            </Td>
                            <Td color={mainColor}>
                              <Text color={'orange.500'}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Text>
                            </Td>
                            <Td>
                              <VStack spacing={1}>
                                <Button
                                  bg={accentColor}
                                  color={mainColor}
                                  _hover={{
                                    bg: inputBg,
                                    color: mainColor,
                                    transform: 'scale(1.05)',
                                  }}
                                  transition="all 0.2s"
                                  size="sm"
                                  height="32px"
                                  px={2}
                                  onClick={() => handleCancel(request.id)}
                                >
                                  Cancel
                                </Button>
                              </VStack>
                            </Td>
                          </Tr>
                        );
                      })
                    ) : (
                      <Tr>
                        <Td colSpan={8} textAlign="center" py={6}>
                          <HStack justify="center" align="center" spacing={2}>
                            <Icon as={WarningIcon} color={mainColor} />
                            <Text fontWeight="bold" color={mainColor}>
                              You haven't created any requests!
                            </Text>
                          </HStack>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  };

  export default TeacherHome;