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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, CloseIcon, InfoIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const TeacherHome = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionRequestId, setActionRequestId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [subRequest, setSubRequest] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  const blockOrder = {
    '1st': 1,
    '2nd': 2,
    '3rd': 3,
    '4th': 4,
    '5th': 5,
  };

  // helper to extract block number from first character
  const getBlockNumber = (blockLabel) => {
    if (!blockLabel) return 999;
    const firstChar = blockLabel.trim().charAt(0);
    const num = parseInt(firstChar, 10);
    return isNaN(num) ? 999 : num;
  };

  useEffect(() => {
    if (!isAuthenticated || user.role !== 'teacher') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/teacher-requests?email=${encodeURIComponent(
            user.email
          )}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
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

  const handleAction = async (requestId, type) => {
    try {
      const endpoint =
        type === 'complete' ? '/complete-request' : '/cancel-request';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, requestId }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`${type} response:`, text);
        throw new Error(`Server responded with ${response.status}: ${text}`);
      }

      const data = await response.json();
      if (data.added) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        toast({
          title: 'Success',
          description:
            type === 'complete'
              ? 'Request marked as completed.'
              : 'Request canceled successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      } else {
        throw new Error(data.error || `Failed to ${type} request`);
      }
    } catch (error) {
      console.error(`Error ${type}ing request:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${type} request.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    }
    setIsActionOpen(false);
    setActionRequestId(null);
    setActionType(null);
  };

  const openActionDialog = (requestId, type) => {
    setActionRequestId(requestId);
    setActionType(type);
    setIsActionOpen(true);
  };

  const closeActionDialog = () => {
    setIsActionOpen(false);
    setActionRequestId(null);
    setActionType(null);
  };

  const openSubDialog = (request) => {
    setSubRequest(request);
    setIsSubOpen(true);
  };

  const handleSchedule = () => {
    navigate('/teacher-scheduler');
  };

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg={bgColor}
      >
        <Spinner size="xl" color={accentColor} />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
      <Container maxW="container.2xl">
        <Card bg={inputBg} boxShadow="xl" borderRadius="lg" mb={6}>
          <CardBody>
            <HStack
              justify="space-between"
              align="center"
              flexWrap="wrap"
              spacing={3}
            >
              <Heading size="xl" color={mainColor}>
                Hello {user.first_name} {user.last_name}!
              </Heading>
              <HStack spacing={3}>
                <Button
                  bgGradient="linear(to-r, rgb(175, 214, 241), rgb(100, 150, 200))"
                  color={mainColor}
                  _hover={{
                    bgGradient:
                      'linear(to-r, rgb(200, 230, 255), rgb(120, 170, 220))',
                    transform: 'scale(1.02)',
                  }}
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
                  _hover={{
                    bg: inputBg,
                    color: mainColor,
                    transform: 'scale(1.02)',
                  }}
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
                      Date (M-D-Y)
                    </Th>
                    <Th color={mainColor} width="10%" whiteSpace="nowrap">
                      Room
                    </Th>
                    <Th color={mainColor} width="10%" whiteSpace="nowrap">
                      Subject
                    </Th>
                    <Th color={mainColor} width="25%" minWidth="200px">
                      Blocks
                    </Th>
                    <Th color={mainColor} width="10%" whiteSpace="nowrap">
                      Notes
                    </Th>
                    <Th color={mainColor} width="15%" whiteSpace="nowrap">
                      Action
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {requests.length > 0 ? (
                    requests.map((request) => {
                      const sortedBlocks = [...request.blocks].sort(
                        (a, b) => getBlockNumber(a.block) - getBlockNumber(b.block)
                      );
                      const [year, month, day] = request.day.split('-');
                      const formattedDate = `${month}-${day}-${year}`;
                      return (
                        <Tr key={request.id}>
                          <Td color={mainColor} whiteSpace="nowrap">
                            {formattedDate}
                          </Td>
                          <Td color={mainColor}>{request.room}</Td>
                          <Td color={mainColor}>{request.subject || '-'}</Td>
                          <Td color={mainColor}>
                            {sortedBlocks.length > 0 ? (
                              <UnorderedList spacing={1}>
                                {sortedBlocks.map((block) => (
                                  <ListItem
                                    key={block.block}
                                    fontSize="14px"
                                    color={
                                      block.assigned ? 'green.500' : 'red.500'
                                    }
                                    fontWeight={
                                      block.assigned ? 'bold' : 'normal'
                                    }
                                  >
                                    {block.block} (
                                    {block.assigned
                                      ? block.substitute_name
                                      : 'Unassigned'}
                                    )
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
                          <Td>
                            <VStack spacing={1}>
                              <Tooltip label="Mark as Completed" hasArrow>
                                <Button
                                  colorScheme="green"
                                  size="sm"
                                  onClick={() =>
                                    openActionDialog(request.id, 'complete')
                                  }
                                >
                                  <Icon as={CheckCircleIcon} boxSize={5} />
                                </Button>
                              </Tooltip>
                              <Tooltip label="Cancel Request" hasArrow>
                                <Button
                                  colorScheme="red"
                                  size="sm"
                                  onClick={() =>
                                    openActionDialog(request.id, 'cancel')
                                  }
                                >
                                  <Icon as={CloseIcon} boxSize={5} />
                                </Button>
                              </Tooltip>
                              <Tooltip label="View Substitutes" hasArrow>
                                <Button
                                  colorScheme="blue"
                                  size="sm"
                                  onClick={() => openSubDialog(request)}
                                >
                                  <Icon as={InfoIcon} boxSize={5} />
                                </Button>
                              </Tooltip>
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={6}>
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

      <AlertDialog isOpen={isActionOpen} onClose={closeActionDialog} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={inputBg}>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              color={mainColor}
            >
              {actionType === 'complete'
                ? 'Confirm Completion'
                : 'Confirm Cancellation'}
            </AlertDialogHeader>
            <AlertDialogBody color={mainColor}>
              Are you sure you want to{' '}
              {actionType === 'complete'
                ? 'mark this request as completed'
                : 'cancel this request'}
              ? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={closeActionDialog} color={mainColor}>
                No
              </Button>
              <Button
                colorScheme={actionType === 'complete' ? 'green' : 'red'}
                onClick={() => handleAction(actionRequestId, actionType)}
                ml={3}
              >
                Yes, {actionType === 'complete' ? 'Complete' : 'Cancel'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog isOpen={isSubOpen} onClose={() => setIsSubOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={inputBg}>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              color={mainColor}
            >
              Substitute Information
            </AlertDialogHeader>
            <AlertDialogBody color={mainColor}>
              {subRequest && subRequest.blocks ? (
                (() => {
                  const assignedBlocks = subRequest.blocks
                    .filter((b) => b.assigned)
                    .sort(
                      (a, b) => getBlockNumber(a.block) - getBlockNumber(b.block)
                    );
                  return assignedBlocks.length > 0 ? (
                    <VStack align="start" spacing={2}>
                      {assignedBlocks.map((block) => (
                        <Text key={block.block}>
                          {block.block}: {block.substitute_name} (
                          <a href={`mailto:${block.substitute_email}`}>
                            {block.substitute_email || 'Email not available'}
                          </a>)
                        </Text>
                      ))}
                    </VStack>
                  ) : (
                    <Text>No substitutes assigned yet.</Text>
                  );
                })()
              ) : (
                <Text>No information available.</Text>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setIsSubOpen(false)} color={mainColor}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default TeacherHome;