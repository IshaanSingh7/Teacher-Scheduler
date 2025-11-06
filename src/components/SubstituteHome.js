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

  useEffect(() => {
    if (!isAuthenticated || user.role !== 'substitute') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Assigned
        const assignedRes = await fetch(`/api/substitute-requests?email=${encodeURIComponent(user.email)}`);
        const assigned = assignedRes.ok ? await assignedRes.json() : [];

        // Open (all uncompleted, regardless of block status)
        const openRes = await fetch(`/api/sub-open-requests?subEmail=${encodeURIComponent(user.email)}`);
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
        toast({ title: 'Success', description: 'Assignment canceled.', status: 'success', duration: 5000, isClosable: true, bg: inputBg, color: mainColor });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel.', status: 'error', duration: 5000, isClosable: true, bg: inputBg, color: mainColor });
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

  const getBlockNumber = (b) => {
    const n = parseInt(b.trim()[0], 10);
    return isNaN(n) ? 999 : n;
  };

  if (isLoading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
        <Spinner size="xl" color={accentColor} />
      </Box>
    );
  }

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

        {/* Assigned Blocks */}
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
                      ? new Date(request.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : '';

                    const sortedBlocks = [...request.blocks].sort((a, b) => getBlockNumber(a) - getBlockNumber(b));

                    return (
                      <Tr key={request.id}>
                        <Td color={mainColor}>
                          <Button
                            size="sm"
                            variant="link"
                            colorScheme="blue"
                            onClick={() => {
                              navigator.clipboard.writeText(request.teacher_email);
                              toast({ title: 'Copied', description: `Copied ${request.teacher_email}`, status: 'success', duration: 3000, isClosable: true, bg: inputBg, color: mainColor });
                            }}
                          >
                            {request.teacher_name}
                          </Button>
                        </Td>
                        <Td color={mainColor}>{formattedDay}</Td>
                        <Td color={mainColor}>{request.subject}</Td>
                        <Td color={mainColor}>{request.room}</Td>
                        <Td color={mainColor}>
                          <VStack align="start" spacing={1}>
                            {sortedBlocks.map((block, i) => (
                              <Button
                                key={i}
                                size="xs"
                                colorScheme="blue"
                                onClick={() => {
                                  const eventDate = new Date(request.day);
                                  const timeMatch = block.match(/(\d{1,2}:\d{2}(?:am|pm))-(\d{1,2}:\d{2}(?:am|pm))/i);
                                  if (!timeMatch) return;
                                  const [_, startStr, endStr] = timeMatch;

                                  const parse = (t) => {
                                    let [h, m] = t.match(/\d+/g).map(Number);
                                    if (/pm/i.test(t) && h !== 12) h += 12;
                                    if (/am/i.test(t) && h === 12) h = 0;
                                    return { h, m };
                                  };

                                  const start = parse(startStr);
                                  const end = parse(endStr);
                                  const sd = new Date(eventDate);
                                  sd.setHours(start.h, start.m);
                                  const ed = new Date(eventDate);
                                  ed.setHours(end.h, end.m);

                                  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0];
                                  const title = encodeURIComponent(`${block} - ${request.subject} with ${request.teacher_name}`);
                                  const details = encodeURIComponent(`Substitute assignment. Contact: ${request.teacher_email}`);
                                  const loc = encodeURIComponent(request.room);
                                  const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${fmt(sd)}/${fmt(ed)}&details=${details}&location=${loc}&add=${user.email}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                {block}
                              </Button>
                            ))}
                          </VStack>
                        </Td>
                        <Td
                          color={mainColor}
                          cursor={request.notes ? 'pointer' : 'default'}
                          textDecoration={request.notes ? 'underline' : 'none'}
                          onClick={() => request.notes && openNotesDialog(request.notes)}
                        >
                          {request.notes ? 'View' : 'None'}
                        </Td>
                        <Td>
                          <Button size="sm" colorScheme="red" onClick={() => openCancelDialog(request.id)}>
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

        {/* Open Requests Section */}
        <Heading size="md" mb={4} color={inputBg}>
          Open Substitute Requests
        </Heading>
        {openRequests.length === 0 ? (
          <Text color={inputBg}>No open requests at this time.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {openRequests.map((req) => {
              const sorted = [...req.blocks].sort((a, b) => getBlockNumber(a.block) - getBlockNumber(b.block));
              return (
                <Card key={req.id} bg={inputBg} boxShadow="md" borderRadius="lg">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold" color={mainColor}>
                        {req.teacher_name} – {req.subject} (Room {req.room})
                      </Text>
                      <Text fontSize="sm" color={mainColor}>
                        {new Date(req.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <VStack align="start" spacing={1} w="full">
                        {sorted.map((b) => (
                          <HStack key={b.block} justify="space-between" w="full">
                            <Text
                              fontSize="sm"
                              color={b.assigned ? 'red.600' : 'green.600'}
                              fontWeight={b.assigned ? 'normal' : 'bold'}
                            >
                              {b.block} {b.assigned ? '(Taken)' : '(Open)'}
                            </Text>
                            {!b.assigned && b.signup_link && (
                              <Link href={b.signup_link} color="blue.600" fontSize="sm" isExternal>
                                Sign Up
                              </Link>
                            )}
                          </HStack>
                        ))}
                      </VStack>
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

        {/* Dialogs */}
        <AlertDialog isOpen={isCancelOpen} onClose={closeCancelDialog} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent bg={inputBg}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>Cancel Assignment</AlertDialogHeader>
              <AlertDialogBody color={mainColor}>Are you sure? This cannot be undone.</AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={closeCancelDialog} color={mainColor}>No</Button>
                <Button colorScheme="red" onClick={() => handleCancel(cancelRequestId)} ml={3}>Yes, Cancel</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        <AlertDialog isOpen={!!selectedNotes} onClose={closeNotesDialog} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent bg={inputBg}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>Notes</AlertDialogHeader>
              <AlertDialogBody color={mainColor}>{selectedNotes}</AlertDialogBody>
              <AlertDialogFooter>
                <Button onClick={closeNotesDialog} color={mainColor}>Close</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default SubstituteHome;