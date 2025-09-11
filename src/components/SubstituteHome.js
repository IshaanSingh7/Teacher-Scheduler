import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  useToast,
  Tooltip,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  List,
  UnorderedList,
  ListItem,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';
import { WarningIcon, CalendarIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SubstituteHome = ({ onLogout }) => {
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelRequestId, setCancelRequestId] = useState(null);
  const [completeRequestId, setCompleteRequestId] = useState(null);
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isCompleteOpen, onOpen: onCompleteOpen, onClose: onCompleteClose } = useDisclosure();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Theme colors
  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(20, 54, 100)';
  const inputBg = '#FFFFFF';

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'substitute') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/accepted-requests?email=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const responseData = await response.json();
          const formattedData = responseData.map(req => ({
            ...req,
            status: req.status || 'uncompleted'
          }));
          setAcceptedRequests(formattedData);
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

  const handleCancelInitiate = (requestId) => {
    setCancelRequestId(requestId);
    onCancelOpen();
  };

  const handleCancelConfirm = async () => {
  if (!cancelRequestId) return;

  try {
    const response = await fetch(`http://localhost:3001/requests/${cancelRequestId}/cancel-substitute`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });

    if (response.ok) {
      setAcceptedRequests((prev) => prev.filter((req) => req.id !== cancelRequestId));
      toast({
        title: 'Success',
        description: 'Request cancelled successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    } else {
      const errorResponse = await response.json();
      toast({
        title: 'Error',
        description: errorResponse.error || 'Failed to cancel request.',
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
      description: 'Error cancelling request.',
      status: 'error',
      duration: 5000,
      isClosable: true,
      bg: inputBg,
      color: mainColor,
    });
  } finally {
    onCancelClose();
    setCancelRequestId(null);
  }
};

  const handleCompleteInitiate = (requestId) => {
    setCompleteRequestId(requestId);
    onCompleteOpen();
  };

  const handleCompleteConfirm = async () => {
    if (!completeRequestId) return;

    try {
      const response = await fetch(`http://localhost:3001/requests/${completeRequestId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        setAcceptedRequests((prev) =>
          prev.map((req) =>
            req.id === completeRequestId ? { ...req, status: 'completed' } : req
          )
        );
        toast({
          title: 'Success',
          description: 'Request marked as completed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      } else {
        const errorResponse = await response.json();
        toast({
          title: 'Error',
          description: errorResponse.error || 'Failed to mark request as completed.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      }
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: 'Error',
        description: 'Error completing request.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    } finally {
      onCompleteClose();
      setCompleteRequestId(null);
    }
  };

  const handleDismiss = (requestId) => {
    setAcceptedRequests((prev) => prev.filter((req) => req.id !== requestId));
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

  const handleCopyEmail = async (teacherEmail) => {
    if (!teacherEmail) {
      toast({
        title: 'Error',
        description: 'No email available for this teacher.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(teacherEmail);
      toast({
        title: 'Success',
        description: `Email ${teacherEmail} copied to clipboard!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    } catch (error) {
      console.error('Error copying email:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy email to clipboard.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    }
  };

  const generateGoogleCalendarLinks = (request) => {
    const { day, blocks_requested, teacher_first_name, teacher_last_name, room, notes, subject } = request;
    if (!day || !blocks_requested || !user.email) return [];

    const blockTimes = {
      '1st Period: 8:19am-9:14am': { start: '08:19', end: '09:14' },
      '2nd Period: 9:52am-11:02am': { start: '09:52', end: '11:02' },
      '3rd Period (flex): 11:06am-12:26pm': { start: '11:06', end: '12:26' },
      '3rd Period (no flex): 11:31am-12:26pm': { start: '11:31', end: '12:26' },
      '4th Period: 1:02pm-1:47pm': { start: '13:02', end: '13:47' },
      '5th Period: 1:51pm-2:46pm': { start: '13:51', end: '14:46' },
    };

    const blocks = blocks_requested.split(',').map(block => block.trim());
    const date = new Date(day);
    if (isNaN(date)) {
      console.warn(`Invalid date for request ${request.id}: ${day}`);
      return [];
    }

    const formatDateTime = (date, time) => {
      const [hours, minutes] = time.split(':');
      const dt = new Date(date);
      dt.setHours(parseInt(hours), parseInt(minutes), 0);
      return dt.toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');
    };

    return blocks.map(block => {
      const periodMatch = Object.keys(blockTimes).find(key => block.includes(key.split(':')[0]));
      if (!periodMatch) {
        console.warn(`Unrecognized block for request ${request.id}: ${block}`);
        return null;
      }

      const { start, end } = blockTimes[periodMatch];
      const startTime = formatDateTime(date, start);
      const endTime = formatDateTime(date, end);
      const teacherName = `${teacher_first_name} ${teacher_last_name}`;
      const title = encodeURIComponent(`Substitute for ${teacherName} - ${subject} - ${block}`);
      const details = encodeURIComponent(`Teacher: ${teacherName}\nSubject: ${subject}\nRoom: ${room}\nNotes: ${notes || 'None'}`);
      const location = encodeURIComponent(room);
      const attendees = encodeURIComponent(user.email);

      return {
        block,
        url: `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}&add=${attendees}`,
      };
    }).filter(link => link);
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
      {loading ? (
        <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
          <Spinner size="xl" color={accentColor} />
        </Box>
      ) : (
        <>
          <Card bg={inputBg} boxShadow="lg" borderRadius="lg" mb={6}>
            <CardBody>
              <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
                <Heading size="lg" color={mainColor}>
                  Hello {user.first_name} {user.last_name}!
                </Heading>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor }}
                  onClick={logout}
                  size="md"
                >
                  Logout
                </Button>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
            <CardBody>
              <Heading size="md" mb={4} textAlign="center" color={mainColor}>
                Requests You've Accepted
              </Heading>
              <Box overflowX="auto">
                <Table size="sm" variant="simple" bg={inputBg} borderRadius="md" width="100%">
                  <Thead bg={accentColor}>
                    <Tr>
                      <Th color={mainColor} whiteSpace="nowrap" width="10%">Date (Y/M/D)</Th>
                      <Th color={mainColor} whiteSpace="nowrap" width="15%">Teacher</Th>
                      <Th color={mainColor} whiteSpace="nowrap" width="10%">Subject</Th>
                      <Th color={mainColor} whiteSpace="nowrap" width="5%">Room</Th>
                      <Th color={mainColor} width="30%" minWidth="200px">Blocks Requested</Th>
                      <Th color={mainColor} whiteSpace="nowrap" width="10%">Notes</Th>
                      <Th color={mainColor} whiteSpace="nowrap" width="10%">Status</Th>
                      <Th color={mainColor} whiteSpace="nowrap" width="15%">Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {acceptedRequests.length > 0 ? (
                      acceptedRequests.map((request) => {
                        const calendarLinks = generateGoogleCalendarLinks(request);
                        const blocks = request.blocks_requested
                          ? request.blocks_requested.split(',').map(row => row.trim())
                          : [];
                        const status = request.status || 'uncompleted';
                        const isCompleted = status === 'completed';
                        return (
                          <Tr key={request.id} bg={isCompleted ? 'gray.100' : undefined} opacity={isCompleted ? 0.6 : 1}>
                            <Td color={mainColor} whiteSpace="nowrap">{request.day}</Td>
                            <Td color={mainColor}>
                              <Tooltip
                                label={request.teacher_email ? `Copy email address` : 'No email available'}
                                hasArrow
                                placement="top"
                                bg={inputBg}
                                color={mainColor}
                              >
                                <Button
                                  variant="link"
                                  color={mainColor}
                                  size="sm"
                                  _hover={{ color: request.teacher_email ? accentColor : mainColor }}
                                  isTruncated
                                  maxWidth="120px"
                                  display="inline-block"
                                  onClick={() => handleCopyEmail(request.teacher_email)}
                                  isDisabled={!request.teacher_email || isCompleted}
                                >
                                  {request.teacher_first_name} {request.teacher_last_name}
                                </Button>
                              </Tooltip>
                            </Td>
                            <Td color={mainColor}>{request.subject || '-'}</Td>
                            <Td color={mainColor}>{request.room}</Td>
                            <Td color={mainColor} whiteSpace="normal">
                              {blocks.length > 0 ? (
                                <UnorderedList spacing={1} maxWidth="100%">
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
                              <Tooltip label={request.notes || 'No notes'} hasArrow placement="top" maxWidth="300px" bg={inputBg} color={mainColor}>
                                <Button
                                  variant="link"
                                  color={mainColor}
                                  size="sm"
                                  _hover={{ color: accentColor }}
                                  isDisabled={isCompleted}
                                >
                                  View Notes
                                </Button>
                              </Tooltip>
                            </Td>
                            <Td color={mainColor}>
                              <Text color={status === 'completed' ? 'green.500' : 'orange.500'}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Text>
                            </Td>
                            <Td>
                              <VStack spacing={1}>
                                {!isCompleted && (
                                  <Button
                                    bg="green.500"
                                    color="white"
                                    _hover={{ bg: 'green.600' }}
                                    size="xs"
                                    px={2}
                                    height="24px"
                                    minHeight="24px"
                                    onClick={() => handleCompleteInitiate(request.id)}
                                    isDisabled={isCompleted}
                                  >
                                    Complete
                                  </Button>
                                )}
                                <Button
                                  bg={accentColor}
                                  color={mainColor}
                                  _hover={{ bg: inputBg, color: mainColor }}
                                  size="xs"
                                  px={2}
                                  height="24px"
                                  minHeight="24px"
                                  onClick={() => handleCancelInitiate(request.id)}
                                  isDisabled={isCompleted}
                                >
                                  Cancel
                                </Button>
                                {calendarLinks.length > 0 ? (
                                  <Menu>
                                    <MenuButton
                                      as={Button}
                                      size="xs"
                                      bg={accentColor}
                                      color={mainColor}
                                      _hover={{ bg: inputBg, color: mainColor }}
                                      leftIcon={<CalendarIcon />}
                                      px={2}
                                      height="24px"
                                      minHeight="24px"
                                      width="100%"
                                      textAlign="left"
                                      isDisabled={isCompleted}
                                    >
                                      Calendar
                                    </MenuButton>
                                    <MenuList bg={inputBg}>
                                      {calendarLinks.map((link, index) => (
                                        <MenuItem
                                          key={index}
                                          as="a"
                                          href={link.url}
                                          target="_blank"
                                          bg={inputBg}
                                          color={mainColor}
                                          _hover={{ bg: accentColor, color: mainColor }}
                                        >
                                          {link.block}
                                        </MenuItem>
                                      ))}
                                    </MenuList>
                                  </Menu>
                                ) : (
                                  <Button
                                    size="xs"
                                    px={2}
                                    height="24px"
                                    minHeight="24px"
                                    bg={accentColor}
                                    color={mainColor}
                                    isDisabled
                                  >
                                    Calendar
                                  </Button>
                                )}
                                {isCompleted && (
                                  <Button
                                    bg="gray.500"
                                    color="white"
                                    _hover={{ bg: 'gray.600' }}
                                    size="xs"
                                    px={2}
                                    height="24px"
                                    minHeight="24px"
                                    onClick={() => handleDismiss(request.id)}
                                  >
                                    Dismiss
                                  </Button>
                                )}
                              </VStack>
                            </Td>
                          </Tr>
                        );
                      })
                    ) : (
                      <Tr>
                        <Td colSpan={8} textAlign="center" py={8}>
                          <HStack justify="center" align="center" spacing={2}>
                            <Icon as={WarningIcon} color={mainColor} />
                            <Text fontWeight="bold" color={mainColor}>
                              Looks like you haven't accepted any requests!
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

          <Modal isOpen={isCancelOpen} onClose={onCancelClose} isCentered>
            <ModalOverlay />
            <ModalContent bg={inputBg} color={mainColor}>
              <ModalHeader>Confirm Cancellation</ModalHeader>
              <ModalBody>
                <Text>Are you sure you want to cancel this substitute request?</Text>
              </ModalBody>
              <ModalFooter>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor }}
                  marginRight={2}
                  onClick={onCancelClose}
                >
                  Back
                </Button>
                <Button
                  bg="red.500"
                  color="white"
                  _hover={{ bg: 'red.600' }}
                  onClick={handleCancelConfirm}
                >
                  Confirm
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isCompleteOpen} onClose={onCompleteClose} isCentered>
            <ModalOverlay />
            <ModalContent bg={inputBg} color={mainColor}>
              <ModalHeader>Confirm Completion</ModalHeader>
              <ModalBody>
                <Text>Are you sure you want to mark this substitute request as completed? An email will be sent to the teacher.</Text>
              </ModalBody>
              <ModalFooter>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor }}
                  marginRight={2}
                  onClick={onCompleteClose}
                >
                  Back
                </Button>
                <Button
                  bg="green.500"
                  color="white"
                  _hover={{ bg: 'green.600' }}
                  onClick={handleCompleteConfirm}
                >
                  Confirm
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default SubstituteHome;