// import { useState, useEffect } from 'react';
// import {
//   Box,
//   Card,
//   CardBody,
//   Heading,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   Text,
//   useToast,
//   Spinner,
//   Button,
//   AlertDialog,
//   AlertDialogBody,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogContent,
//   AlertDialogOverlay,
// } from '@chakra-ui/react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../AuthContext';

// const SubstituteHome = () => {
//   const [requests, setRequests] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [cancelRequestId, setCancelRequestId] = useState(null);
//   const [isCancelOpen, setIsCancelOpen] = useState(false);
//   const { user, isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const toast = useToast();

//   const mainColor = 'rgb(20, 54, 100)';
//   const accentColor = 'rgb(175, 214, 241)';
//   const bgColor = 'rgb(30, 64, 110)';
//   const inputBg = '#FFFFFF';

//   useEffect(() => {
//     if (!isAuthenticated || user.role !== 'substitute') {
//       navigate('/login');
//       return;
//     }

//     const fetchRequests = async () => {
//       try {
//         const response = await fetch(`http://localhost:3001/substitute-requests?email=${encodeURIComponent(user.email)}`);
//         if (response.ok) {
//           const data = await response.json();
//           setRequests(data);
//         } else {
//           throw new Error('Failed to fetch requests');
//         }
//       } catch (error) {
//         console.error('Error fetching requests:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to fetch requests.',
//           status: 'error',
//           duration: 5000,
//           isClosable: true,
//           bg: inputBg,
//           color: mainColor,
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchRequests();
//   }, [isAuthenticated, user, navigate, toast]);

//   const handleCancel = async (requestId) => {
//     try {
//       const response = await fetch('http://localhost:3001/cancel-assignment', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: user.email, requestId }),
//       });

//       if (!response.ok) {
//         const text = await response.text();
//         console.error('Cancel response:', text);
//         throw new Error(`Server responded with ${response.status}: ${text}`);
//       }

//       const data = await response.json();
//       if (data.added) {
//         setRequests(requests.filter(req => req.id !== requestId));
//         toast({
//           title: 'Success',
//           description: 'Assignment canceled successfully.',
//           status: 'success',
//           duration: 5000,
//           isClosable: true,
//           bg: inputBg,
//           color: mainColor,
//         });
//       } else {
//         throw new Error(data.error || 'Failed to cancel assignment');
//       }
//     } catch (error) {
//       console.error('Error canceling assignment:', error);
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to cancel assignment.',
//         status: 'error',
//         duration: 5000,
//         isClosable: true,
//         bg: inputBg,
//         color: mainColor,
//       });
//     }
//     setIsCancelOpen(false);
//     setCancelRequestId(null);
//   };

//   const openCancelDialog = (requestId) => {
//     setCancelRequestId(requestId);
//     setIsCancelOpen(true);
//   };

//   const closeCancelDialog = () => {
//     setIsCancelOpen(false);
//     setCancelRequestId(null);
//   };

//   if (isLoading) {
//     return (
//       <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
//         <Spinner size="xl" color={accentColor} />
//       </Box>
//     );
//   }

//   return (
//     <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
//       <Heading size="lg" mb={6} color={inputBg} textAlign="center">
//         Hello {user.first_name} {user.last_name}
//       </Heading>
//       <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
//         <CardBody>
//           <Heading size="md" mb={4} color={mainColor}>
//             Your Assigned Blocks
//           </Heading>
//           {requests.length === 0 ? (
//             <Text color={mainColor}>No assigned blocks.</Text>
//           ) : (
//             <Table variant="simple" colorScheme="blue">
//               <Thead>
//                 <Tr>
//                   <Th color={mainColor}>Teacher</Th>
//                   <Th color={mainColor}>Day</Th>
//                   <Th color={mainColor}>Subject</Th>
//                   <Th color={mainColor}>Room</Th>
//                   <Th color={mainColor}>Blocks</Th>
//                   <Th color={mainColor}>Notes</Th>
//                   <Th color={mainColor}>Action</Th>
//                 </Tr>
//               </Thead>
//               <Tbody>
//                 {requests.map(request => (
//                   <Tr key={request.id}>
//                     <Td color={mainColor}>{request.teacher_name}</Td>
//                     <Td color={mainColor}>{request.day}</Td>
//                     <Td color={mainColor}>{request.subject}</Td>
//                     <Td color={mainColor}>{request.room}</Td>
//                     <Td color={mainColor}>{request.blocks.join(', ')}</Td>
//                     <Td color={mainColor}>{request.notes || 'None'}</Td>
//                     <Td>
//                       <Button
//                         size="sm"
//                         colorScheme="red"
//                         onClick={() => openCancelDialog(request.id)}
//                       >
//                         Cancel
//                       </Button>
//                     </Td>
//                   </Tr>
//                 ))}
//               </Tbody>
//             </Table>
//           )}
//         </CardBody>
//       </Card>

//       <AlertDialog
//         isOpen={isCancelOpen}
//         onClose={closeCancelDialog}
//         isCentered
//       >
//         <AlertDialogOverlay>
//           <AlertDialogContent bg={inputBg}>
//             <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
//               Cancel Assignment
//             </AlertDialogHeader>
//             <AlertDialogBody color={mainColor}>
//               Are you sure you want to cancel this assignment? This action cannot be undone.
//             </AlertDialogBody>
//             <AlertDialogFooter>
//               <Button onClick={closeCancelDialog} color={mainColor}>
//                 No
//               </Button>
//               <Button
//                 colorScheme="red"
//                 onClick={() => handleCancel(cancelRequestId)}
//                 ml={3}
//               >
//                 Yes, Cancel
//               </Button>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialogOverlay>
//       </AlertDialog>
//     </Box>
//   );
// };

// export default SubstituteHome;

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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SubstituteHome = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelRequestId, setCancelRequestId] = useState(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState(null);
  const { user, isAuthenticated } = useAuth();
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

    const fetchRequests = async () => {
      try {
        const response = await fetch(`http://localhost:3001/substitute-requests?email=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        } else {
          throw new Error('Failed to fetch requests');
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch requests.',
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

    fetchRequests();
  }, [isAuthenticated, user, navigate, toast]);

  const handleCancel = async (requestId) => {
    try {
      const response = await fetch('http://localhost:3001/cancel-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, requestId }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Cancel response:', text);
        throw new Error(`Server responded with ${response.status}: ${text}`);
      }

      const data = await response.json();
      if (data.added) {
        setRequests(requests.filter(req => req.id !== requestId));
        toast({
          title: 'Success',
          description: 'Assignment canceled successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      } else {
        throw new Error(data.error || 'Failed to cancel assignment');
      }
    } catch (error) {
      console.error('Error canceling assignment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel assignment.',
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

  const openCancelDialog = (requestId) => {
    setCancelRequestId(requestId);
    setIsCancelOpen(true);
  };

  const closeCancelDialog = () => {
    setIsCancelOpen(false);
    setCancelRequestId(null);
  };

  const openNotesDialog = (notes) => {
    setSelectedNotes(notes || 'No notes provided.');
  };

  const closeNotesDialog = () => {
    setSelectedNotes(null);
  };

  const getBlockNumber = (block) => {
    if (!block) return 999;
    const firstChar = block.trim()[0];
    const num = parseInt(firstChar, 10);
    return isNaN(num) ? 999 : num;
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
    <Heading size="lg" mb={6} color={inputBg} textAlign="center">
      Hello {user.first_name} {user.last_name}
    </Heading>
    <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
      <CardBody>
        <Heading size="md" mb={4} color={mainColor}>
          Your Assigned Blocks
        </Heading>
        {requests.length === 0 ? (
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
              {requests.map((request) => {
                const formattedDay = request.day
                  ? new Date(request.day).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                const sortedBlocks = [...request.blocks].sort((a, b) => {
                  const numA = parseInt(a[0], 10);
                  const numB = parseInt(b[0], 10);
                  return numA - numB;
                });

                return (
                  <Tr key={request.id}>
                    {/* Teacher name as copy-to-clipboard button */}
                    <Td color={mainColor}>
                      <Button
                        size="sm"
                        variant="link"
                        colorScheme="blue"
                        onClick={() => {
                          navigator.clipboard.writeText(request.teacher_email);
                          toast({
                            title: 'Copied',
                            description: `Copied ${request.teacher_email} to clipboard`,
                            status: 'success',
                            duration: 3000,
                            isClosable: true,
                            bg: inputBg,
                            color: mainColor,
                          });
                        }}
                      >
                        {request.teacher_name}
                      </Button>
                    </Td>

                    <Td color={mainColor}>{formattedDay}</Td>
                    <Td color={mainColor}>{request.subject}</Td>
                    <Td color={mainColor}>{request.room}</Td>

                    {/* Blocks: individual buttons for each block */}
                    <Td color={mainColor}>
                      <Box display="flex" flexDirection="column" gap={2}>
                        {sortedBlocks.map((block, i) => (
                          <Button
                            key={i}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => {
                              const eventDate = new Date(request.day);
                              const timeMatch = block.match(/(\d{1,2}:\d{2}(?:am|pm))-(\d{1,2}:\d{2}(?:am|pm))/i);
                              if (!timeMatch) return;
                              const [_, startTimeStr, endTimeStr] = timeMatch;

                              const parseTime = (timeStr) => {
                                let [hours, minutes] = timeStr.match(/\d+/g).map(Number);
                                if (/pm/i.test(timeStr) && hours !== 12) hours += 12;
                                if (/am/i.test(timeStr) && hours === 12) hours = 0;
                                return { hours, minutes };
                              };

                              const startTime = parseTime(startTimeStr);
                              const endTime = parseTime(endTimeStr);

                              const startDate = new Date(eventDate);
                              startDate.setHours(startTime.hours, startTime.minutes);

                              const endDate = new Date(eventDate);
                              endDate.setHours(endTime.hours, endTime.minutes);

                              const formatDate = (d) => d.toISOString().replace(/-|:|\.\d{3}/g, '');

                              const title = encodeURIComponent(`${block} - ${request.subject} with ${request.teacher_name}`);
                              const details = encodeURIComponent(`Substitute assignment. Contact teacher at ${request.teacher_email}`);
                              const location = encodeURIComponent(request.room);

                              const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}&location=${location}&add=${user.email}`;

                              window.open(calendarUrl, '_blank');
                            }}
                          >
                            {block}
                          </Button>
                        ))}
                      </Box>
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

    {/* Cancel Assignment Dialog */}
    <AlertDialog isOpen={isCancelOpen} onClose={closeCancelDialog} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent bg={inputBg}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
            Cancel Assignment
          </AlertDialogHeader>
          <AlertDialogBody color={mainColor}>
            Are you sure you want to cancel this assignment? This action cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={closeCancelDialog} color={mainColor}>
              No
            </Button>
            <Button
              colorScheme="red"
              onClick={() => handleCancel(cancelRequestId)}
              ml={3}
            >
              Yes, Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>

    {/* Notes Dialog */}
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
  </Box>
);




};

export default SubstituteHome;