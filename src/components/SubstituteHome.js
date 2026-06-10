import { useState, useEffect } from 'react';
import {
  Box,
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
  useToast,
  Spinner,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  VStack,
  HStack,
  Link,
  Container,
  SimpleGrid,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SubstituteHome = () => {
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelRequestId, setCancelRequestId] = useState(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState(null);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  /* --------------------------------------------------------------------- */
  /*  AUTH + DATA FETCHING                                                 */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    if (!isAuthenticated || user.role !== 'substitute') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const assignedRes = await fetch(
          `/api/substitute-requests?email=${encodeURIComponent(user.email)}`
        );
        const assigned = assignedRes.ok ? await assignedRes.json() : [];

        const openRes = await fetch(
          `/api/sub-open-requests?subEmail=${encodeURIComponent(user.email)}`
        );
        const open = openRes.ok ? await openRes.json() : [];

        setAssignedRequests(assigned);
        setOpenRequests(open);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load data.',
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

    fetchData();
  }, [isAuthenticated, user, navigate, toast]);

  /* --------------------------------------------------------------------- */
  /*  CANCEL ASSIGNMENT                                                    */
  /* --------------------------------------------------------------------- */

  useEffect(() => {
    document.title = "Sub Home";
  }, []);
  const handleCancel = async (requestId) => {
    try {
      const response = await fetch('/api/cancel-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, requestId }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      if (data.added) {
        setAssignedRequests((prev) => prev.filter((r) => r.id !== requestId));
        toast({
          title: 'Success',
          description: 'Assignment canceled.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    }
    setIsCancelOpen(false);
    setCancelRequestId(null);
  };

  const openCancelDialog = (id) => {
    setCancelRequestId(id);
    setIsCancelOpen(true);
  };
  const closeCancelDialog = () => {
    setIsCancelOpen(false);
    setCancelRequestId(null);
  };

  const openNotesDialog = (notes) => setSelectedNotes(notes || 'None');
  const closeNotesDialog = () => setSelectedNotes(null);

  const getBlockNumber = (blockName) => {
    const n = parseInt(blockName.trim()[0], 10);
    return isNaN(n) ? 999 : n;
  };

  /* --------------------------------------------------------------------- */
  /*  LOADING SPINNER                                                      */
  /* --------------------------------------------------------------------- */
  if (isLoading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
        <Spinner size="xl" color={accentColor} />
      </Box>
    );
  }

  /* --------------------------------------------------------------------- */
  /*  MAIN RENDER                                                          */
  /* --------------------------------------------------------------------- */
  return (
    <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
      <Container maxW="container.xl">
        {/* Header + Logout */}
        <HStack justify="space-between" mb={6} align="center" flexWrap="wrap">
          <Heading size="lg" color={inputBg}>
            Hello {user.first_name} {user.last_name}
          </Heading>
          <Button
            bg={inputBg}
            color={mainColor}
            borderWidth={1}
            borderColor={mainColor}
            _hover={{ bg: accentColor, color: mainColor }}
            onClick={logout}
          >
            Logout
          </Button>
        </HStack>

        {/* ---------------------- ASSIGNED BLOCKS ---------------------- */}
        <Card bg={inputBg} boxShadow="lg" borderRadius="lg" mb={8}>
          <CardBody>
            <Heading size="md" mb={4} color={mainColor}>
              Your Assigned Blocks
            </Heading>

            {assignedRequests.length === 0 ? (
              <Text color={mainColor}>No assigned blocks.</Text>
            ) : (
              <Table variant="simple" colorScheme="blue">
                <Thead>
                  <Tr>
                    <Th color={mainColor}>Teacher</Th>
                    <Th color={mainColor}>Day</Th>
                    <Th color={mainColor}>Subject</Th>
                    <Th color={mainColor}>Room</Th>
                    <Th color={mainColor}>Blocks</Th>
                    <Th color={mainColor}>Notes</Th>
                    <Th color={mainColor}>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {assignedRequests.map((request) => {
                    const formattedDay = request.day
                      ? new Date(request.day).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      : '';

                    const sortedBlocks = [...request.blocks].sort(
                      (a, b) => getBlockNumber(a) - getBlockNumber(b)
                    );

                    return (
                      <Tr key={request.id}>
                        {/* TEACHER (copy email) */}
                        <Td color={mainColor}>
                          <Button
                            size="sm"
                            variant="link"
                            colorScheme="blue"
                            onClick={() => {
                              const email = request.teacher_email;
                              if (!email) {
                                toast({
                                  title: 'Error',
                                  description: 'No email available.',
                                  status: 'error',
                                  duration: 3000,
                                  isClosable: true,
                                  bg: inputBg,
                                  color: mainColor,
                                });
                                return;
                              }

                              const copyToClipboard = async () => {
                                if (navigator.clipboard && window.isSecureContext) {
                                  try {
                                    await navigator.clipboard.writeText(email);
                                    toast({
                                      title: 'Copied!',
                                      description: email,
                                      status: 'success',
                                      duration: 2000,
                                      isClosable: true,
                                      bg: inputBg,
                                      color: mainColor,
                                    });
                                  } catch {
                                    fallbackCopy();
                                  }
                                } else {
                                  fallbackCopy();
                                }
                              };

                              const fallbackCopy = () => {
                                const textarea = document.createElement('textarea');
                                textarea.value = email;
                                textarea.style.position = 'fixed';
                                textarea.style.opacity = '0';
                                document.body.appendChild(textarea);
                                textarea.select();
                                try {
                                  document.execCommand('copy');
                                  toast({
                                    title: 'Copied!',
                                    description: email,
                                    status: 'success',
                                    duration: 2000,
                                    isClosable: true,
                                    bg: inputBg,
                                    color: mainColor,
                                  });
                                } catch {
                                  toast({
                                    title: 'Failed',
                                    description: 'Could not copy email.',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                }
                                document.body.removeChild(textarea);
                              };

                              copyToClipboard();
                            }}
                          >
                            {request.teacher_name}
                          </Button>
                        </Td>

                        <Td color={mainColor}>{formattedDay}</Td>
                        <Td color={mainColor}>{request.subject}</Td>
                        <Td color={mainColor}>{request.room}</Td>

                        {/* BLOCKS (Google Calendar) */}
                        <Td color={mainColor}>
                          <VStack align="start" spacing={1}>
                            {sortedBlocks.map((block, i) => (
                              <Button
                                key={i}
                                size="xs"
                                colorScheme="blue"
                                onClick={() => {
                                  const eventDate = new Date(request.day);
                                  const timeMatch = block.match(
                                    /(\d{1,2}:\d{2}(?:am|pm))-(\d{1,2}:\d{2}(?:am|pm))/i
                                  );
                                  if (!timeMatch) return;
                                  const [, startStr, endStr] = timeMatch;

                                  const parseTime = (t) => {
                                    const [h, m] = t.match(/\d+/g).map(Number);
                                    const isPM = /pm/i.test(t);
                                    const is12AM = /am/i.test(t) && h === 12;
                                    return {
                                      h: isPM && h !== 12 ? h + 12 : is12AM ? 0 : h,
                                      m,
                                    };
                                  };

                                  const { h: sh, m: sm } = parseTime(startStr);
                                  const { h: eh, m: em } = parseTime(endStr);

                                  const start = new Date(eventDate);
                                  start.setHours(sh, sm);
                                  const end = new Date(eventDate);
                                  end.setHours(eh, em);

                                  const fmt = (d) =>
                                    d.toISOString().replace(/[-:]/g, '').split('.')[0];

                                  const title = encodeURIComponent(
                                    `${block} - ${request.subject} with ${request.teacher_name}`
                                  );
                                  const details = encodeURIComponent(
                                    `Substitute assignment. Contact: ${request.teacher_email}`
                                  );
                                  const loc = encodeURIComponent(request.room);
                                  const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${fmt(
                                    start
                                  )}/${fmt(end)}&details=${details}&location=${loc}&add=${user.email}`;

                                  window.open(url, '_blank');
                                }}
                              >
                                {block}
                              </Button>
                            ))}
                          </VStack>
                        </Td>

                        {/* NOTES */}
                        <Td
                          color={mainColor}
                          cursor={request.notes ? 'pointer' : 'default'}
                          textDecoration={request.notes ? 'underline' : 'none'}
                          onClick={() => request.notes && openNotesDialog(request.notes)}
                        >
                          {request.notes ? 'View' : 'None'}
                        </Td>

                        {/* CANCEL */}
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => openCancelDialog(request.id)}
                          >
                            Cancel
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* ---------------------- OPEN REQUESTS ---------------------- */}
        <Heading size="md" mb={4} color={inputBg}>
          Open Substitute Requests
        </Heading>

        {openRequests.length === 0 ? (
          <Text color={inputBg}>No open requests at this time.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {openRequests.map((req) => {
              const sortedBlocks = [...req.blocks].sort((a, b) =>
                getBlockNumber(a.block) - getBlockNumber(b.block)
              );

              // Check if current sub is already signed up for ANY block
              const isCurrentSubAssigned = sortedBlocks.some(
                (b) => b.assigned && b.sub_email === user.email
              );

              // Find first open block to use its signup_link
              const openBlock = sortedBlocks.find((b) => !b.assigned);
              const signupLink = openBlock ? openBlock.signup_link : null;

              return (
                <Card key={req.id} bg={inputBg} boxShadow="md" borderRadius="lg">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      {/* Header */}
                      <Text fontWeight="bold" color={mainColor}>
                        {req.teacher_name} – {req.subject} (Room {req.room})
                      </Text>
                      <Text fontSize="sm" color={mainColor}>
                        {new Date(req.day).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>

                      {/* Blocks List */}
                      <VStack align="start" spacing={1} w="full">
                        {sortedBlocks.map((b) => {
                          let displayText = b.block;
                          let color = 'green.600';
                          let fontWeight = 'bold';

                          if (b.assigned) {
                            if (b.sub_email === user.email) {
                              // Current sub → GRAY
                              displayText += " (you're already signed up)";
                              color = 'gray.500';
                              fontWeight = 'normal';
                            } else {
                              // Other sub → RED
                              displayText += ' (Taken)';
                              color = 'red.600';
                              fontWeight = 'normal';
                            }
                          } else {
                            // Open → GREEN
                            displayText += ' (Open)';
                          }

                          return (
                            <HStack key={b.block} justify="space-between" w="full">
                              <Text fontSize="sm" color={color} fontWeight={fontWeight}>
                                {displayText}
                              </Text>
                            </HStack>
                          );
                        })}
                      </VStack>

                      {/* ONE Sign Up Link at Bottom */}
                      {signupLink && !isCurrentSubAssigned && (
                        <Link
                          href={signupLink}
                          color="blue.600"
                          fontSize="sm"
                          isExternal
                          alignSelf="flex-end"
                          mt={2}
                        >
                          Sign Up
                        </Link>
                      )}

                      {/* Notes */}
                      {req.notes && (
                        <Text fontSize="xs" color="gray.600" mt={2}>
                          Notes: {req.notes}
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}

        {/* ---------------------- DIALOGS ---------------------- */}
        <AlertDialog isOpen={isCancelOpen} onClose={closeCancelDialog} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent bg={inputBg}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
                Cancel Assignment
              </AlertDialogHeader>
              <AlertDialogBody color={mainColor}>
                Are you sure? This cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={closeCancelDialog} color={mainColor}>
                  No
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => cancelRequestId && handleCancel(cancelRequestId)}
                  ml={3}
                >
                  Yes, Cancel
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        <AlertDialog isOpen={!!selectedNotes} onClose={closeNotesDialog} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent bg={inputBg}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
                Notes
              </AlertDialogHeader>
              <AlertDialogBody color={mainColor}>{selectedNotes}</AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={closeNotesDialog} color={mainColor}>
                  Close
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default SubstituteHome;