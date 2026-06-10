// import { useEffect, useState, useRef } from 'react';
// import {
//   Box,
//   Button,
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
//   HStack,
//   Spinner,
//   useToast,
//   Tooltip,
//   Icon,
//   Container,
//   VStack,
//   UnorderedList,
//   ListItem,
//   AlertDialog,
//   AlertDialogBody,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogContent,
//   AlertDialogOverlay,
//   IconButton,
// } from '@chakra-ui/react';
// import { WarningIcon, CheckCircleIcon, CloseIcon, InfoIcon, EditIcon, ArrowForwardIcon, ArrowBackIcon } from '@chakra-ui/icons';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../AuthContext';

// const AdminHome = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [showCompleted, setShowCompleted] = useState(false);
//   const [totalRequests, setTotalRequests] = useState(0);
//   const [actionRequestId, setActionRequestId] = useState(null);
//   const [actionType, setActionType] = useState(null);
//   const [isActionOpen, setIsActionOpen] = useState(false);
//   const [isSubOpen, setIsSubOpen] = useState(false);
//   const [subRequest, setSubRequest] = useState(null);
//   const { user, isAuthenticated, logout } = useAuth();
//   const navigate = useNavigate();
//   const toast = useToast();
//   const cancelRef = useRef();

//   const mainColor = 'rgb(20, 54, 100)';
//   const accentColor = 'rgb(175, 214, 241)';
//   const bgColor = 'rgb(30, 64, 110)';
//   const inputBg = '#FFFFFF';
//   const limit = 10;

//   const getBlockNumber = (blockLabel) => {
//     if (!blockLabel) return 999;
//     const firstChar = blockLabel.trim().charAt(0);
//     const num = parseInt(firstChar, 10);
//     return isNaN(num) ? 999 : num;
//   };

//   const fetchRequests = async (pageNum) => {
//     setLoading(true);
//     try {
//       const response = await fetch(
//         `/api/admin-requests?page=${pageNum}&limit=${limit}&includeCompleted=${showCompleted}`,
//         { method: 'GET', headers: { 'Content-Type': 'application/json' } }
//       );
//       if (response.ok) {
//         const { requests: newRequests, total } = await response.json();
//         setRequests(newRequests);
//         setTotalRequests(total);
//         setHasMore(newRequests.length === limit);
//       } else {
//         const errorText = await response.text();
//         toast({
//           title: 'Error',
//           description: `Failed to fetch requests: ${errorText || 'Unknown error'}`,
//           status: 'error',
//           duration: 5000,
//           isClosable: true,
//           position: 'bottom',
//           bg: inputBg,
//           color: 'red.600',
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       toast({
//         title: 'Error',
//         description: 'Error fetching requests. Check server availability.',
//         status: 'error',
//         duration: 5000,
//         isClosable: true,
//         position: 'bottom',
//         bg: inputBg,
//         color: 'red.600',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!isAuthenticated || !user) {
//       navigate('/');
//       return;
//     }
//     if (user.role === 'substitute') {
//       navigate('/sub-home');
//       return;
//     }
//     if (user.role === 'teacher') {
//       navigate('/teacher-home');
//       return;
//     }

//     fetchRequests(page);
//   }, [user, isAuthenticated, navigate, showCompleted, page]);

//   const handlePreviousPage = () => {
//     if (page > 1) {
//       const prevPage = page - 1;
//       setPage(prevPage);
//       fetchRequests(prevPage);
//     }
//   };

//   const handleNextPage = () => {
//     if (hasMore) {
//       const nextPage = page + 1;
//       setPage(nextPage);
//       fetchRequests(nextPage);
//     }
//   };

//   const handleToggleCompleted = () => {
//     setShowCompleted((prev) => !prev);
//     setPage(1);
//     fetchRequests(1);
//   };

//   const handleAction = async (requestId, type) => {
//     try {
//       let url;
//       let options;

//       if (type === 'complete') {
//         url = '/api/admin-complete-request';
//         options = {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ email: user.email, requestId }),
//         };
//       } else if (type === 'cancel') {
//         // FIX: Revert to DELETE and point to the correct RESTful route
//         // This matches the app.delete('/api/requests/:id') backend route
//         url = `/api/requests/${requestId}?email=${encodeURIComponent(user.email)}&role=${user.role}`;
//         options = {
//           method: 'DELETE',
//           headers: { 'Content-Type': 'application/json' }
//         };
//       } else {
//         throw new Error(`Unknown action type: ${type}`);
//       }

//       const response = await fetch(url, options);

//       if (!response.ok) {
//         // Try to parse error as JSON first
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || `Server responded with ${response.status}`);
//       }

//       const data = await response.json();

//       // Check for 'deleted' (from the DELETE route) or 'message'
//       if (data.deleted || data.message || data.added) {
//         setRequests((prev) => prev.filter((req) => req.id !== requestId));
//         toast({
//           title: 'Success',
//           description: type === 'complete' ? 'Request marked as completed.' : 'Request deleted successfully.',
//           status: 'success',
//           duration: 5000,
//           isClosable: true,
//           position: 'bottom',
//           bg: 'white', // Ensure high contrast
//           color: 'green.500',
//         });
//       } else {
//         throw new Error(data.error || `Failed to ${type} request`);
//       }
//     } catch (error) {
//       console.error(`Error ${type}ing request:`, error);
//       toast({
//         title: 'Error',
//         description: error.message || `Failed to ${type} request.`,
//         status: 'error',
//         duration: 5000,
//         isClosable: true,
//         position: 'bottom',
//         bg: 'white',
//         color: 'red.600',
//       });
//     } finally {
//       setIsActionOpen(false);
//       setActionRequestId(null);
//       setActionType(null);
//     }
//   };

//   const openActionDialog = (requestId, type) => {
//     setActionRequestId(requestId);
//     setActionType(type);
//     setIsActionOpen(true);
//   };

//   const closeActionDialog = () => {
//     setIsActionOpen(false);
//     setActionRequestId(null);
//     setActionType(null);
//   };

//   const openSubDialog = (request) => {
//     setSubRequest(request);
//     setIsSubOpen(true);
//   };

//   const handleEdit = (requestId) => navigate(`/admin-editor?requestId=${requestId}`);
//   const handleScheduler = () => navigate('/admin-scheduler');
//   const handleAdd = () => navigate('/admin-add');

//   if (loading && page === 1) {
//     return (
//       <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
//         <Spinner size="xl" color={accentColor} />
//       </Box>
//     );
//   }

//   return (

//     <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
//       <Container maxW="container.2xl">
//         {/* Dashboard header */}
//         <Card bg={inputBg} boxShadow="xl" borderRadius="lg" mb={6}>
//           <CardBody>
//             <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
//               <Heading size="xl" color={mainColor}>Admin Dashboard</Heading>
//               <HStack spacing={3}>
//                 <Button bg={accentColor} color={mainColor} _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }} transition="all 0.2s" onClick={handleScheduler} size="md">Schedule for Teacher</Button>
//                 <Button bg={accentColor} color={mainColor} _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }} transition="all 0.2s" onClick={handleAdd} size="md">Add User</Button>
//                 <Button bg={inputBg} color={mainColor} borderColor={mainColor} borderWidth={1} _hover={{ bg: accentColor, color: mainColor, transform: 'scale(1.02)' }} transition="all 0.2s" onClick={logout} size="md">Logout</Button>
//                 <Button bg={showCompleted ? 'gray.300' : accentColor} color={mainColor} _hover={{ bg: showCompleted ? 'gray.400' : inputBg, color: mainColor }} transition="all 0.2s" onClick={handleToggleCompleted} size="md">
//                   {showCompleted ? 'Hide Completed' : 'Show Completed'}
//                 </Button>
//               </HStack>
//             </HStack>
//           </CardBody>
//         </Card>

//         {/* Requests table */}
//         <Card bg={inputBg} boxShadow="xl" borderRadius="lg">
//           <CardBody>
//             <Heading size="md" mb={4} textAlign="center" color={mainColor}>All Requests</Heading>
//             <Box overflowX="auto">
//               <Table variant="simple" bg={inputBg} borderRadius="md" size="sm">
//                 <Thead bg={accentColor}>
//                   <Tr>
//                     <Th color={mainColor} width="10%" whiteSpace="nowrap">ID</Th>
//                     <Th color={mainColor} width="15%" whiteSpace="nowrap">Teacher</Th>
//                     <Th color={mainColor} width="20%" minWidth="200px">Blocks</Th>
//                     <Th color={mainColor} width="15%" whiteSpace="nowrap">Subject</Th>
//                     <Th color={mainColor} width="10%" whiteSpace="nowrap">Room</Th>
//                     <Th color={mainColor} width="10%" whiteSpace="nowrap">Date (M-D-Y)</Th>
//                     <Th color={mainColor} width="15%" whiteSpace="nowrap">Actions</Th>
//                   </Tr>
//                 </Thead>
//                 <Tbody>
//                   {console.log(user.email)
//                   }
//                   {
//                     console.log(user.role)
//                   }
//                   {requests.length > 0 ? requests.map((request) => {
//                     const sortedBlocks = [...request.blocks].sort((a, b) => getBlockNumber(a.block) - getBlockNumber(b.block));
//                     const [year, month, day] = request.day.split('-');
//                     const formattedDate = `${month}-${day}-${year}`;
//                     const isCompleted = request.status === 'completed';
//                     return (
//                       <Tr key={request.id} bg={isCompleted ? 'gray.100' : 'inherit'} opacity={isCompleted ? 0.6 : 1}>
//                         <Td color={mainColor}>{request.id}</Td>
//                         <Td color={mainColor}>{request.teacher}</Td>
//                         <Td color={mainColor}>
//                           {sortedBlocks.length > 0 ? (
//                             <UnorderedList spacing={1}>
//                               {sortedBlocks.map((block) => (
//                                 <ListItem key={block.block} fontSize="14px" color={block.assigned ? 'green.500' : 'red.500'} fontWeight={block.assigned ? 'bold' : 'normal'}>
//                                   {block.block} ({block.assigned ? block.substitute_name : 'Unassigned'})
//                                 </ListItem>
//                               ))}
//                             </UnorderedList>
//                           ) : <Text>-</Text>}
//                         </Td>
//                         <Td color={mainColor}>{request.subject || '-'}</Td>
//                         <Td color={mainColor}>{request.room}</Td>
//                         <Td color={mainColor} whiteSpace="nowrap">{formattedDate}</Td>
//                         <Td>
//                           <VStack spacing={1}>
//                             {!isCompleted && (
//                               <>
//                                 <Tooltip label="Mark as Completed" hasArrow>
//                                   <IconButton colorScheme="green" size="sm" onClick={() => openActionDialog(request.id, 'complete')} icon={<CheckCircleIcon boxSize={5} />} aria-label="Complete request" />
//                                 </Tooltip>
//                                 <Tooltip label="Cancel Request" hasArrow>
//                                   <IconButton colorScheme="red" size="sm" onClick={() => openActionDialog(request.id, 'cancel')} icon={<CloseIcon boxSize={5} />} aria-label="Cancel request" />
//                                 </Tooltip>
//                                 <Tooltip label="Edit Request" hasArrow>
//                                   <IconButton colorScheme="teal" size="sm" onClick={() => handleEdit(request.id)} icon={<EditIcon boxSize={5} />} aria-label="Edit request" />
//                                 </Tooltip>
//                               </>
//                             )}
//                             <Tooltip label="View Substitutes" hasArrow>
//                               <IconButton colorScheme="blue" size="sm" onClick={() => openSubDialog(request)} icon={<InfoIcon boxSize={5} />} aria-label="View substitutes" />
//                             </Tooltip>
//                           </VStack>
//                         </Td>
//                       </Tr>
//                     );
//                   }) : (
//                     <Tr>
//                       <Td colSpan={7} textAlign="center" py={6}>
//                         <HStack justify="center" align="center" spacing={2}>
//                           <Icon as={WarningIcon} color={mainColor} />
//                           <Text fontWeight="bold" color={mainColor}>No requests available</Text>
//                         </HStack>
//                       </Td>
//                     </Tr>
//                   )}
//                 </Tbody>
//               </Table>
//             </Box>

//             <Box mt={4} display="flex" justifyContent="flex-end">
//               <HStack spacing={2}>
//                 <Button bg={accentColor} color={mainColor} _hover={{ bg: inputBg, color: mainColor }} isDisabled={page === 1 || loading} isLoading={loading} onClick={handlePreviousPage} leftIcon={<ArrowBackIcon />}>Previous</Button>
//                 <Button bg={accentColor} color={mainColor} _hover={{ bg: inputBg, color: mainColor }} isDisabled={!hasMore || loading} isLoading={loading} onClick={handleNextPage} rightIcon={<ArrowForwardIcon />}>Next</Button>
//               </HStack>
//             </Box>
//           </CardBody>
//         </Card>
//       </Container>

//       {/* Confirmation dialogs */}
//       <AlertDialog isOpen={isActionOpen} leastDestructiveRef={cancelRef} onClose={closeActionDialog} isCentered>
//         <AlertDialogOverlay>
//           <AlertDialogContent bg={inputBg}>
//             <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
//               {actionType === 'complete' ? 'Confirm Completion' : 'Confirm Cancellation'}
//             </AlertDialogHeader>
//             <AlertDialogBody color={mainColor}>
//               Are you sure you want to {actionType === 'complete' ? 'mark this request as completed' : 'cancel this request'}? This action cannot be undone.
//             </AlertDialogBody>
//             <AlertDialogFooter>
//               <Button ref={cancelRef} onClick={closeActionDialog} color={mainColor}>No</Button>
//               <Button colorScheme={actionType === 'complete' ? 'green' : 'red'} onClick={() => handleAction(actionRequestId, actionType)} ml={3}>
//                 Yes, {actionType === 'complete' ? 'Complete' : 'Cancel'}
//               </Button>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialogOverlay>
//       </AlertDialog>

//       <AlertDialog isOpen={isSubOpen} leastDestructiveRef={cancelRef} onClose={() => setIsSubOpen(false)} isCentered>
//         <AlertDialogOverlay>
//           <AlertDialogContent bg={inputBg}>
//             <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>Substitute Information</AlertDialogHeader>
//             <AlertDialogBody color={mainColor}>
//               {subRequest ? (
//                 <VStack align="start" spacing={4}>
//                   {/* ---------- ASSIGNED SUBSTITUTES ---------- */}
//                   <Box w="full">
//                     <Text fontWeight="bold" mb={2}>Assigned Substitutes</Text>
//                     {(() => {
//                       const assignedBlocks = subRequest.blocks
//                         ?.filter(b => b.assigned)
//                         .sort((a, b) => getBlockNumber(a.block) - getBlockNumber(b.block)) ?? [];

//                       return assignedBlocks.length > 0 ? (
//                         <VStack align="start" spacing={1}>
//                           {assignedBlocks.map(block => (
//                             <Text key={block.block} fontSize="sm">
//                               {block.block}: {block.substitute_name}{' '}
//                               <a href={`mailto:${block.substitute_email}`} style={{ color: 'blue.600' }}>
//                                 ({block.substitute_email || 'Email not available'})
//                               </a>
//                             </Text>
//                           ))}
//                         </VStack>
//                       ) : (
//                         <Text fontSize="sm" color="gray.500">
//                           No substitutes assigned yet.
//                         </Text>
//                       );
//                     })()}
//                   </Box>

//                   {/* ---------- NOTIFICATION RECIPIENTS (from sent) ---------- */}
//                   <Box w="full" pt={2} borderTop="1px" borderColor="gray.300">
//                     <Text fontWeight="bold" mb={1}>Notification Recipients</Text>
//                     {subRequest.sent ? (
//                       <VStack align="start" spacing={1}>
//                         {subRequest.sent
//                           .split(',')
//                           .map(e => e.trim())
//                           .filter(e => e)
//                           .map((email, i) => (
//                             <Text key={i} fontSize="sm">
//                               <a href={`mailto:${email}`} style={{ color: 'blue.600' }}>
//                                 {email}
//                               </a>
//                             </Text>
//                           ))}
//                       </VStack>
//                     ) : (
//                       <Text fontSize="sm" color="gray.500">
//                         No recipients recorded.
//                       </Text>
//                     )}
//                   </Box>
//                 </VStack>
//               ) : (
//                 <Text>No information available.</Text>
//               )}
//             </AlertDialogBody>
//             <AlertDialogFooter>
//               <Button ref={cancelRef} onClick={() => setIsSubOpen(false)} color={mainColor}>Close</Button>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialogOverlay>
//       </AlertDialog>
//     </Box>
//   );
// };

// export default AdminHome;



import { useEffect, useState, useRef } from 'react';
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
  IconButton,
  Select,
  Divider,
} from '@chakra-ui/react';
import { WarningIcon, CheckCircleIcon, CloseIcon, InfoIcon, EditIcon, ArrowForwardIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminHome = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const [actionRequestId, setActionRequestId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [subRequest, setSubRequest] = useState(null);
  
  // New states for expanding notifications
  const [allUsers, setAllUsers] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [isExpanding, setIsExpanding] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = useRef();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';
  const limit = 10;

  const getBlockNumber = (blockLabel) => {
    if (!blockLabel) return 999;
    const firstChar = blockLabel.trim().charAt(0);
    const num = parseInt(firstChar, 10);
    return isNaN(num) ? 999 : num;
  };

  const fetchRequests = async (pageNum) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin-requests?page=${pageNum}&limit=${limit}&includeCompleted=${showCompleted}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const { requests: newRequests, total } = await response.json();
        setRequests(newRequests);
        setTotalRequests(total);
        setHasMore(newRequests.length === limit);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users to populate the "Add More" dropdown
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users'); // Ensure this endpoint exists
      if (response.ok) {
        const data = await response.json();
        // Filter for substitutes only if needed, or allow all
        setAllUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/');
      return;
    }
    fetchRequests(page);
    fetchAllUsers();
  }, [user, isAuthenticated, navigate, showCompleted, page]);

  const handlePreviousPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchRequests(prevPage);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRequests(nextPage);
    }
  };

  const handleToggleCompleted = () => {
    setShowCompleted((prev) => !prev);
    setPage(1);
    fetchRequests(1);
  };

  const handleAction = async (requestId, type) => {
    try {
      let url;
      let options;

      if (type === 'complete') {
        url = '/api/admin-complete-request';
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, requestId }),
        };
      } else if (type === 'cancel') {
        url = `/api/requests/${requestId}?email=${encodeURIComponent(user.email)}&role=${user.role}`;
        options = { method: 'DELETE', headers: { 'Content-Type': 'application/json' } };
      }

      const response = await fetch(url, options);
      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        toast({ title: 'Success', status: 'success', duration: 3000 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionOpen(false);
    }
  };

  const handleExpandNotifications = async () => {
    if (selectedSubs.length === 0) return;
    setIsExpanding(true);
    try {
      const response = await fetch('/api/expand-request-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: subRequest.id,
          selectedSubs: selectedSubs.map(email => ({ email })),
        }),
      });

      if (response.ok) {
        toast({ title: 'Notifications Sent', status: 'success', duration: 3000 });
        setSelectedSubs([]);
        setIsSubOpen(false); // Close modal on success
        fetchRequests(page); // Refresh data to show new "sent" list
      }
    } catch (error) {
      toast({ title: 'Error sending notifications', status: 'error' });
    } finally {
      setIsExpanding(false);
    }
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
    setSelectedSubs([]); // Reset selection when opening new request
    setIsSubOpen(true);
  };

  const handleEdit = (requestId) => navigate(`/admin-editor?requestId=${requestId}`);
  const handleScheduler = () => navigate('/admin-scheduler');
  const handleAdd = () => navigate('/admin-add');

  if (loading && page === 1) {
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
              <Heading size="xl" color={mainColor}>Admin Dashboard</Heading>
              <HStack spacing={3}>
                <Button bg={accentColor} color={mainColor} onClick={handleScheduler}>Schedule for Teacher</Button>
                <Button bg={accentColor} color={mainColor} onClick={handleAdd}>Add User</Button>
                <Button bg={inputBg} color={mainColor} borderColor={mainColor} borderWidth={1} onClick={logout}>Logout</Button>
                <Button bg={showCompleted ? 'gray.300' : accentColor} color={mainColor} onClick={handleToggleCompleted}>
                  {showCompleted ? 'Hide Completed' : 'Show Completed'}
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={inputBg} boxShadow="xl" borderRadius="lg">
          <CardBody>
            <Heading size="md" mb={4} textAlign="center" color={mainColor}>All Requests</Heading>
            <Box overflowX="auto">
              <Table variant="simple" bg={inputBg} size="sm">
                <Thead bg={accentColor}>
                  <Tr>
                    <Th color={mainColor}>ID</Th>
                    <Th color={mainColor}>Teacher</Th>
                    <Th color={mainColor}>Blocks</Th>
                    <Th color={mainColor}>Subject</Th>
                    <Th color={mainColor}>Room</Th>
                    <Th color={mainColor}>Date</Th>
                    <Th color={mainColor}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {requests.map((request) => {
                    const sortedBlocks = [...request.blocks].sort((a, b) => getBlockNumber(a.block) - getBlockNumber(b.block));
                    const [year, month, day] = request.day.split('-');
                    const formattedDate = `${month}-${day}-${year}`;
                    const isCompleted = request.status === 'completed';
                    return (
                      <Tr key={request.id} bg={isCompleted ? 'gray.100' : 'inherit'}>
                        <Td color={mainColor}>{request.id}</Td>
                        <Td color={mainColor}>{request.teacher}</Td>
                        <Td color={mainColor}>
                          <UnorderedList spacing={1}>
                            {sortedBlocks.map((block) => (
                              <ListItem key={block.block} fontSize="14px" color={block.assigned ? 'green.500' : 'red.500'}>
                                {block.block} ({block.assigned ? block.substitute_name : 'Unassigned'})
                              </ListItem>
                            ))}
                          </UnorderedList>
                        </Td>
                        <Td color={mainColor}>{request.subject || '-'}</Td>
                        <Td color={mainColor}>{request.room}</Td>
                        <Td color={mainColor}>{formattedDate}</Td>
                        <Td>
                          <VStack spacing={1}>
                            {!isCompleted && (
                              <>
                                <IconButton colorScheme="green" size="sm" onClick={() => openActionDialog(request.id, 'complete')} icon={<CheckCircleIcon />} aria-label="Complete" />
                                <IconButton colorScheme="red" size="sm" onClick={() => openActionDialog(request.id, 'cancel')} icon={<CloseIcon />} aria-label="Cancel" />
                                <IconButton colorScheme="teal" size="sm" onClick={() => handleEdit(request.id)} icon={<EditIcon />} aria-label="Edit" />
                              </>
                            )}
                            <IconButton colorScheme="blue" size="sm" onClick={() => openSubDialog(request)} icon={<InfoIcon />} aria-label="Info" />
                          </VStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
            <Box mt={4} display="flex" justifyContent="flex-end">
              <HStack spacing={2}>
                <Button bg={accentColor} color={mainColor} isDisabled={page === 1} onClick={handlePreviousPage} leftIcon={<ArrowBackIcon />}>Previous</Button>
                <Button bg={accentColor} color={mainColor} isDisabled={!hasMore} onClick={handleNextPage} rightIcon={<ArrowForwardIcon />}>Next</Button>
              </HStack>
            </Box>
          </CardBody>
        </Card>
      </Container>

      {/* Confirmation Dialog */}
      <AlertDialog isOpen={isActionOpen} leastDestructiveRef={cancelRef} onClose={closeActionDialog} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={inputBg}>
            <AlertDialogHeader color={mainColor}>{actionType === 'complete' ? 'Confirm Completion' : 'Confirm Cancellation'}</AlertDialogHeader>
            <AlertDialogBody color={mainColor}>Are you sure? This action cannot be undone.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeActionDialog}>No</Button>
              <Button colorScheme={actionType === 'complete' ? 'green' : 'red'} onClick={() => handleAction(actionRequestId, actionType)} ml={3}>Yes</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* SUB INFO DIALOG WITH NEW NOTIFICATION FEATURE */}
      <AlertDialog isOpen={isSubOpen} leastDestructiveRef={cancelRef} onClose={() => setIsSubOpen(false)} isCentered size="4xl">
        <AlertDialogOverlay>
          <AlertDialogContent bg={inputBg} maxW="900px">
            <AlertDialogHeader color={mainColor} borderBottom="1px solid #eee">
              Request Details & Notifications (ID: {subRequest?.id})
            </AlertDialogHeader>
            <AlertDialogBody color={mainColor} py={6}>
              {subRequest ? (
                <HStack align="start" spacing={8} divider={<Divider orientation="vertical" height="auto" />}>
                  
                  {/* LEFT COLUMN: EXISTING INFO */}
                  <VStack align="start" spacing={6} flex="1">
                    <Box w="full">
                      <Text fontWeight="bold" fontSize="md" mb={2}>Assigned Substitutes</Text>
                      {subRequest.blocks?.some(b => b.assigned) ? (
                        <UnorderedList spacing={2} ml={0} styleType="none">
                          {subRequest.blocks.filter(b => b.assigned).map(block => (
                            <ListItem key={block.block} p={2} bg="green.50" borderRadius="md" borderLeft="4px solid green">
                              <Text fontWeight="bold" fontSize="sm">{block.block}</Text>
                              <Text fontSize="xs">{block.substitute_name} ({block.substitute_email})</Text>
                            </ListItem>
                          ))}
                        </UnorderedList>
                      ) : <Text fontSize="sm" color="gray.500 italic">None assigned yet.</Text>}
                    </Box>

                    <Box w="full">
                      <Text fontWeight="bold" fontSize="md" mb={2}>Current Recipients</Text>
                      <Box maxH="150px" overflowY="auto" w="full" p={2} bg="gray.50" borderRadius="md">
                        {subRequest.sent ? subRequest.sent.split(',').map((email, i) => (
                          <Text key={i} fontSize="xs" py={1}>{email.trim()}</Text>
                        )) : <Text fontSize="xs" color="gray.500">No emails sent yet.</Text>}
                      </Box>
                    </Box>
                  </VStack>

                  {/* RIGHT COLUMN: NOTIFY MORE FEATURE */}
                  <VStack align="start" spacing={4} flex="1">
                    <Box w="full">
                      <Text fontWeight="bold" fontSize="md" color={mainColor} mb={1}>Notify Additional Substitutes</Text>
                      <Text fontSize="xs" color="gray.600" mb={3}>
                        Select people from the list below to send them the signup link for this request.
                      </Text>
                      
                      <Box 
                        border="1px solid" 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        maxH="200px" 
                        overflowY="auto" 
                        p={2}
                        mb={4}
                      >
                        <VStack align="start" spacing={1}>
                          {allUsers
                            .filter(u => u.role !== 'teacher') // Only show subs
                            .filter(u => !subRequest.sent?.includes(u.email)) // Don't show already notified
                            .map(user => (
                              <HStack key={user.email} w="full">
                                <input 
                                  type="checkbox" 
                                  checked={selectedSubs.includes(user.email)}
                                  onChange={(e) => {
                                    if(e.target.checked) setSelectedSubs([...selectedSubs, user.email]);
                                    else setSelectedSubs(selectedSubs.filter(em => em !== user.email));
                                  }}
                                />
                                <Text fontSize="sm">{user.first_name} {user.last_name}</Text>
                              </HStack>
                          ))}
                        </VStack>
                      </Box>

                      <Button 
                        w="full" 
                        colorScheme="blue" 
                        onClick={handleExpandNotifications}
                        isLoading={isExpanding}
                        isDisabled={selectedSubs.length === 0}
                        leftIcon={<ArrowForwardIcon />}
                      >
                        Send to {selectedSubs.length} Selected
                      </Button>
                    </Box>
                  </VStack>

                </HStack>
              ) : <Spinner />}
            </AlertDialogBody>
            <AlertDialogFooter borderTop="1px solid #eee">
              <Button ref={cancelRef} onClick={() => setIsSubOpen(false)}>Close</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AdminHome;