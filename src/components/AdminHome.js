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
//   const textColor = '#FFFFFF';
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
//         `http://localhost:3001/admin-requests?page=${pageNum}&limit=${limit}&includeCompleted=${showCompleted}`,
//         {
//           method: 'GET',
//           headers: { 'Content-Type': 'application/json' },
//         }
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
//   }, [user, isAuthenticated, navigate, toast, showCompleted, page]);

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
//       const endpoint = type === 'complete' ? '/complete-request' : '/requests';
//       const url = `http://localhost:3001${endpoint}/${requestId}`;
//       const payload = type === 'complete' ? { email: user.email, requestId } : {};
//       console.log(`Sending ${type} request to ${url} with payload:`, payload);

//       const response = await fetch(url, {
//         method: type === 'complete' ? 'POST' : 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: type === 'complete' ? JSON.stringify(payload) : undefined,
//       });

//       if (!response.ok) {
//         const text = await response.text();
//         console.error(`${type} response:`, text);
//         throw new Error(`Server responded with ${response.status}: ${text}`);
//       }

//       setRequests((prev) => prev.filter((req) => req.id !== requestId));
//       toast({
//         title: 'Success',
//         description: type === 'complete' ? 'Request marked as completed.' : 'Request canceled successfully.',
//         status: 'success',
//         duration: 5000,
//         isClosable: true,
//         position: 'bottom',
//         bg: inputBg,
//         color: 'green.500',
//       });
//     } catch (error) {
//       console.error(`Error ${type}ing request:`, error);
//       toast({
//         title: 'Error',
//         description: error.message || `Failed to ${type} request.`,
//         status: 'error',
//         duration: 5000,
//         isClosable: true,
//         position: 'bottom',
//         bg: inputBg,
//         color: 'red.600',
//       });
//     }
//     setIsActionOpen(false);
//     setActionRequestId(null);
//     setActionType(null);
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
//       <Box
//         minH="100vh"
//         display="flex"
//         justifyContent="center"
//         alignItems="center"
//         bg={bgColor}
//       >
//         <Spinner size="xl" color={accentColor} />
//       </Box>
//     );
//   }

//   return (
//     <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
//       <Container maxW="container.2xl">
//         <Card bg={inputBg} boxShadow="xl" borderRadius="lg" mb={6}>
//           <CardBody>
//             <HStack
//               justify="space-between"
//               align="center"
//               flexWrap="wrap"
//               spacing={3}
//             >
//               <Heading size="xl" color={mainColor}>
//                 Admin Dashboard
//               </Heading>
//               <HStack spacing={3}>
//                 <Button
//                   bg={accentColor}
//                   color={mainColor}
//                   _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }}
//                   transition="all 0.2s"
//                   onClick={handleScheduler}
//                   size="md"
//                 >
//                   Schedule for Teacher
//                 </Button>
//                 <Button
//                   bg={accentColor}
//                   color={mainColor}
//                   _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }}
//                   transition="all 0.2s"
//                   onClick={handleAdd}
//                   size="md"
//                 >
//                   Add User
//                 </Button>
//                 <Button
//                   bg={inputBg}
//                   color={mainColor}
//                   borderColor={mainColor}
//                   borderWidth={1}
//                   _hover={{ bg: accentColor, color: mainColor, transform: 'scale(1.02)' }}
//                   transition="all 0.2s"
//                   onClick={logout}
//                   size="md"
//                 >
//                   Logout
//                 </Button>
//                 <Button
//                   bg={showCompleted ? 'gray.300' : accentColor}
//                   color={mainColor}
//                   _hover={{ bg: showCompleted ? 'gray.400' : inputBg, color: mainColor }}
//                   transition="all 0.2s"
//                   onClick={handleToggleCompleted}
//                   size="md"
//                 >
//                   {showCompleted ? 'Hide Completed' : 'Show Completed'}
//                 </Button>
//               </HStack>
//             </HStack>
//           </CardBody>
//         </Card>

//         <Card bg={inputBg} boxShadow="xl" borderRadius="lg">
//           <CardBody>
//             <Heading size="md" mb={4} textAlign="center" color={mainColor}>
//               All Requests
//             </Heading>
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
//                   {requests.length > 0 ? (
//                     requests.map((request) => {
//                       const sortedBlocks = [...request.blocks].sort(
//                         (a, b) => getBlockNumber(a.block) - getBlockNumber(b.block)
//                       );
//                       const [year, month, day] = request.day.split('-');
//                       const formattedDate = `${month}-${day}-${year}`;
//                       const isCompleted = request.status === 'completed';
//                       return (
//                         <Tr
//                           key={request.id}
//                           bg={isCompleted ? 'gray.100' : 'inherit'}
//                           opacity={isCompleted ? 0.6 : 1}
//                         >
//                           <Td color={mainColor}>{request.id}</Td>
//                           <Td color={mainColor}>{request.teacher}</Td>
//                           <Td color={mainColor}>
//                             {sortedBlocks.length > 0 ? (
//                               <UnorderedList spacing={1}>
//                                 {sortedBlocks.map((block) => (
//                                   <ListItem
//                                     key={block.block}
//                                     fontSize="14px"
//                                     color={block.assigned ? 'green.500' : 'red.500'}
//                                     fontWeight={block.assigned ? 'bold' : 'normal'}
//                                   >
//                                     {block.block} ({block.assigned ? block.substitute_name : 'Unassigned'})
//                                   </ListItem>
//                                 ))}
//                               </UnorderedList>
//                             ) : (
//                               <Text>-</Text>
//                             )}
//                           </Td>
//                           <Td color={mainColor}>{request.subject || '-'}</Td>
//                           <Td color={mainColor}>{request.room}</Td>
//                           <Td color={mainColor} whiteSpace="nowrap">{formattedDate}</Td>
//                           <Td>
//                             <VStack spacing={1}>
//                               {!isCompleted && (
//                                 <Tooltip label="Mark as Completed" hasArrow>
//                                   <IconButton
//                                     colorScheme="green"
//                                     size="sm"
//                                     onClick={() => openActionDialog(request.id, 'complete')}
//                                     icon={<CheckCircleIcon boxSize={5} />}
//                                     aria-label="Complete request"
//                                   />
//                                 </Tooltip>
//                               )}
//                               <Tooltip label="Cancel Request" hasArrow>
//                                 <IconButton
//                                   colorScheme="red"
//                                   size="sm"
//                                   onClick={() => openActionDialog(request.id, 'cancel')}
//                                   icon={<CloseIcon boxSize={5} />}
//                                   aria-label="Cancel request"
//                                 />
//                               </Tooltip>
//                               <Tooltip label="View Substitutes" hasArrow>
//                                 <IconButton
//                                   colorScheme="blue"
//                                   size="sm"
//                                   onClick={() => openSubDialog(request)}
//                                   icon={<InfoIcon boxSize={5} />}
//                                   aria-label="View substitutes"
//                                 />
//                               </Tooltip>
//                               <Tooltip label="Edit Request" hasArrow>
//                                 <IconButton
//                                   colorScheme="teal"
//                                   size="sm"
//                                   onClick={() => handleEdit(request.id)}
//                                   icon={<EditIcon boxSize={5} />}
//                                   aria-label="Edit request"
//                                 />
//                               </Tooltip>
//                             </VStack>
//                           </Td>
//                         </Tr>
//                       );
//                     })
//                   ) : (
//                     <Tr>
//                       <Td colSpan={7} textAlign="center" py={6}>
//                         <HStack justify="center" align="center" spacing={2}>
//                           <Icon as={WarningIcon} color={mainColor} />
//                           <Text fontWeight="bold" color={mainColor}>
//                             No requests available
//                           </Text>
//                         </HStack>
//                       </Td>
//                     </Tr>
//                   )}
//                 </Tbody>
//               </Table>
//             </Box>
//             <Box mt={4} display="flex" justifyContent="flex-end">
//               <HStack spacing={2}>
//                 <Button
//                   bg={accentColor}
//                   color={mainColor}
//                   _hover={{ bg: inputBg, color: mainColor }}
//                   isDisabled={page === 1 || loading}
//                   isLoading={loading}
//                   onClick={handlePreviousPage}
//                   leftIcon={<ArrowBackIcon />}
//                 >
//                   Previous
//                 </Button>
//                 <Button
//                   bg={accentColor}
//                   color={mainColor}
//                   _hover={{ bg: inputBg, color: mainColor }}
//                   isDisabled={!hasMore || loading}
//                   isLoading={loading}
//                   onClick={handleNextPage}
//                   rightIcon={<ArrowForwardIcon />}
//                 >
//                   Next
//                 </Button>
//               </HStack>
//             </Box>
//           </CardBody>
//         </Card>
//       </Container>

//       <AlertDialog isOpen={isActionOpen} leastDestructiveRef={cancelRef} onClose={closeActionDialog} isCentered>
//         <AlertDialogOverlay>
//           <AlertDialogContent bg={inputBg}>
//             <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
//               {actionType === 'complete' ? 'Confirm Completion' : 'Confirm Cancellation'}
//             </AlertDialogHeader>
//             <AlertDialogBody color={mainColor}>
//               Are you sure you want to{' '}
//               {actionType === 'complete' ? 'mark this request as completed' : 'cancel this request'}? 
//               This action cannot be undone.
//             </AlertDialogBody>
//             <AlertDialogFooter>
//               <Button ref={cancelRef} onClick={closeActionDialog} color={mainColor}>
//                 No
//               </Button>
//               <Button
//                 colorScheme={actionType === 'complete' ? 'green' : 'red'}
//                 onClick={() => handleAction(actionRequestId, actionType)}
//                 ml={3}
//               >
//                 Yes, {actionType === 'complete' ? 'Complete' : 'Cancel'}
//               </Button>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialogOverlay>
//       </AlertDialog>

//       <AlertDialog isOpen={isSubOpen} leastDestructiveRef={cancelRef} onClose={() => setIsSubOpen(false)} isCentered>
//         <AlertDialogOverlay>
//           <AlertDialogContent bg={inputBg}>
//             <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
//               Substitute Information
//             </AlertDialogHeader>
//             <AlertDialogBody color={mainColor}>
//               {subRequest && subRequest.blocks ? (
//                 (() => {
//                   const assignedBlocks = subRequest.blocks
//                     .filter((b) => b.assigned)
//                     .sort((a, b) => getBlockNumber(a.block) - getBlockNumber(b.block));
//                   return assignedBlocks.length > 0 ? (
//                     <VStack align="start" spacing={2}>
//                       {assignedBlocks.map((block) => (
//                         <Text key={block.block}>
//                           {block.block}: {block.substitute_name} (
//                           <a href={`mailto:${block.substitute_email}`}>
//                             {block.substitute_email || 'Email not available'}
//                           </a>)
//                         </Text>
//                       ))}
//                     </VStack>
//                   ) : (
//                     <Text>No substitutes assigned yet.</Text>
//                   );
//                 })()
//               ) : (
//                 <Text>No information available.</Text>
//               )}
//             </AlertDialogBody>
//             <AlertDialogFooter>
//               <Button ref={cancelRef} onClick={() => setIsSubOpen(false)} color={mainColor}>
//                 Close
//               </Button>
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
        `http://localhost:3001/admin-requests?page=${pageNum}&limit=${limit}&includeCompleted=${showCompleted}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (response.ok) {
        const { requests: newRequests, total } = await response.json();
        setRequests(newRequests);
        setTotalRequests(total);
        setHasMore(newRequests.length === limit);
      } else {
        const errorText = await response.text();
        toast({
          title: 'Error',
          description: `Failed to fetch requests: ${errorText || 'Unknown error'}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
          bg: inputBg,
          color: 'red.600',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Error fetching requests. Check server availability.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/');
      return;
    }
    if (user.role === 'substitute') {
      navigate('/sub-home');
      return;
    }
    if (user.role === 'teacher') {
      navigate('/teacher-home');
      return;
    }

    fetchRequests(page);
  }, [user, isAuthenticated, navigate, toast, showCompleted, page]);

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
      const endpoint = type === 'complete' ? '/admin-complete-request' : '/requests';
      const method = type === 'complete' ? 'POST' : 'DELETE';
      const url = `http://localhost:3001${endpoint}${type === 'complete' ? '' : '/' + requestId}`;
      const payload = type === 'complete' ? { email: user.email, requestId } : {};
      console.log(`Sending ${type} request to ${url} with payload:`, payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: type === 'complete' ? JSON.stringify(payload) : undefined,
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
          description: type === 'complete' ? 'Request marked as completed.' : 'Request canceled successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
          bg: inputBg,
          color: 'green.500',
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
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
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

  const handleEdit = (requestId) => navigate(`/admin-editor?requestId=${requestId}`);
  const handleScheduler = () => navigate('/admin-scheduler');
  const handleAdd = () => navigate('/admin-add');

  if (loading && page === 1) {
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
                Admin Dashboard
              </Heading>
              <HStack spacing={3}>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }}
                  transition="all 0.2s"
                  onClick={handleScheduler}
                  size="md"
                >
                  Schedule for Teacher
                </Button>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.02)' }}
                  transition="all 0.2s"
                  onClick={handleAdd}
                  size="md"
                >
                  Add User
                </Button>
                <Button
                  bg={inputBg}
                  color={mainColor}
                  borderColor={mainColor}
                  borderWidth={1}
                  _hover={{ bg: accentColor, color: mainColor, transform: 'scale(1.02)' }}
                  transition="all 0.2s"
                  onClick={logout}
                  size="md"
                >
                  Logout
                </Button>
                <Button
                  bg={showCompleted ? 'gray.300' : accentColor}
                  color={mainColor}
                  _hover={{ bg: showCompleted ? 'gray.400' : inputBg, color: mainColor }}
                  transition="all 0.2s"
                  onClick={handleToggleCompleted}
                  size="md"
                >
                  {showCompleted ? 'Hide Completed' : 'Show Completed'}
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        <Card bg={inputBg} boxShadow="xl" borderRadius="lg">
          <CardBody>
            <Heading size="md" mb={4} textAlign="center" color={mainColor}>
              All Requests
            </Heading>
            <Box overflowX="auto">
              <Table variant="simple" bg={inputBg} borderRadius="md" size="sm">
                <Thead bg={accentColor}>
                  <Tr>
                    <Th color={mainColor} width="10%" whiteSpace="nowrap">ID</Th>
                    <Th color={mainColor} width="15%" whiteSpace="nowrap">Teacher</Th>
                    <Th color={mainColor} width="20%" minWidth="200px">Blocks</Th>
                    <Th color={mainColor} width="15%" whiteSpace="nowrap">Subject</Th>
                    <Th color={mainColor} width="10%" whiteSpace="nowrap">Room</Th>
                    <Th color={mainColor} width="10%" whiteSpace="nowrap">Date (M-D-Y)</Th>
                    <Th color={mainColor} width="15%" whiteSpace="nowrap">Actions</Th>
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
                      const isCompleted = request.status === 'completed';
                      return (
                        <Tr
                          key={request.id}
                          bg={isCompleted ? 'gray.100' : 'inherit'}
                          opacity={isCompleted ? 0.6 : 1}
                        >
                          <Td color={mainColor}>{request.id}</Td>
                          <Td color={mainColor}>{request.teacher}</Td>
                          <Td color={mainColor}>
                            {sortedBlocks.length > 0 ? (
                              <UnorderedList spacing={1}>
                                {sortedBlocks.map((block) => (
                                  <ListItem
                                    key={block.block}
                                    fontSize="14px"
                                    color={block.assigned ? 'green.500' : 'red.500'}
                                    fontWeight={block.assigned ? 'bold' : 'normal'}
                                  >
                                    {block.block} ({block.assigned ? block.substitute_name : 'Unassigned'})
                                  </ListItem>
                                ))}
                              </UnorderedList>
                            ) : (
                              <Text>-</Text>
                            )}
                          </Td>
                          <Td color={mainColor}>{request.subject || '-'}</Td>
                          <Td color={mainColor}>{request.room}</Td>
                          <Td color={mainColor} whiteSpace="nowrap">{formattedDate}</Td>
                          <Td>
                            <VStack spacing={1}>
                              {!isCompleted && (
                                <Tooltip label="Mark as Completed" hasArrow>
                                  <IconButton
                                    colorScheme="green"
                                    size="sm"
                                    onClick={() => openActionDialog(request.id, 'complete')}
                                    icon={<CheckCircleIcon boxSize={5} />}
                                    aria-label="Complete request"
                                  />
                                </Tooltip>
                              )}
                              <Tooltip label="Cancel Request" hasArrow>
                                <IconButton
                                  colorScheme="red"
                                  size="sm"
                                  onClick={() => openActionDialog(request.id, 'cancel')}
                                  icon={<CloseIcon boxSize={5} />}
                                  aria-label="Cancel request"
                                />
                              </Tooltip>
                              <Tooltip label="View Substitutes" hasArrow>
                                <IconButton
                                  colorScheme="blue"
                                  size="sm"
                                  onClick={() => openSubDialog(request)}
                                  icon={<InfoIcon boxSize={5} />}
                                  aria-label="View substitutes"
                                />
                              </Tooltip>
                              <Tooltip label="Edit Request" hasArrow>
                                <IconButton
                                  colorScheme="teal"
                                  size="sm"
                                  onClick={() => handleEdit(request.id)}
                                  icon={<EditIcon boxSize={5} />}
                                  aria-label="Edit request"
                                />
                              </Tooltip>
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={6}>
                        <HStack justify="center" align="center" spacing={2}>
                          <Icon as={WarningIcon} color={mainColor} />
                          <Text fontWeight="bold" color={mainColor}>
                            No requests available
                          </Text>
                        </HStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
            <Box mt={4} display="flex" justifyContent="flex-end">
              <HStack spacing={2}>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor }}
                  isDisabled={page === 1 || loading}
                  isLoading={loading}
                  onClick={handlePreviousPage}
                  leftIcon={<ArrowBackIcon />}
                >
                  Previous
                </Button>
                <Button
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor }}
                  isDisabled={!hasMore || loading}
                  isLoading={loading}
                  onClick={handleNextPage}
                  rightIcon={<ArrowForwardIcon />}
                >
                  Next
                </Button>
              </HStack>
            </Box>
          </CardBody>
        </Card>
      </Container>

      <AlertDialog isOpen={isActionOpen} leastDestructiveRef={cancelRef} onClose={closeActionDialog} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={inputBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
              {actionType === 'complete' ? 'Confirm Completion' : 'Confirm Cancellation'}
            </AlertDialogHeader>
            <AlertDialogBody color={mainColor}>
              Are you sure you want to{' '}
              {actionType === 'complete' ? 'mark this request as completed' : 'cancel this request'}? 
              This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeActionDialog} color={mainColor}>
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

      <AlertDialog isOpen={isSubOpen} leastDestructiveRef={cancelRef} onClose={() => setIsSubOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={inputBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={mainColor}>
              Substitute Information
            </AlertDialogHeader>
            <AlertDialogBody color={mainColor}>
              {subRequest && subRequest.blocks ? (
                (() => {
                  const assignedBlocks = subRequest.blocks
                    .filter((b) => b.assigned)
                    .sort((a, b) => getBlockNumber(a.block) - getBlockNumber(b.block));
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
              <Button ref={cancelRef} onClick={() => setIsSubOpen(false)} color={mainColor}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AdminHome;