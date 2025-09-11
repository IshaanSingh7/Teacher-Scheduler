import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  HStack,
  Card,
  CardBody,
  List,
  ListItem,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminHome = () => {
  const [requests, setRequests] = useState([]);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Theme colors
  const mainColor = 'rgb(20, 54, 100)'; // Navy blue
  const accentColor = 'rgb(175, 214, 241)'; // Light blue
  const bgColor = 'rgb(30, 64, 110)'; // Lighter navy blue
  const textColor = '#FFFFFF'; // White for contrast
  const inputBg = '#FFFFFF'; // White for table and cards

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

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/get-everything');
        if (response.ok) {
          setRequests(await response.json());
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [user, isAuthenticated, navigate]);

  const handleEdit = (requestId) => navigate(`/admin-editor?requestId=${requestId}`);
  const handleScheduler = () => navigate('/admin-scheduler');
  const handleAdd = () => navigate('/admin-add');

  const handleCancel = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:3001/requests/${requestId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setRequests(requests.filter((request) => request.id !== requestId));
      } else {
        console.error('Failed to delete request');
      }
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
      <Card bg={mainColor} boxShadow="lg" borderRadius="lg" mb={6}>
        <CardBody>
          <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
            <Heading size="lg" color={textColor}>
              Admin Dashboard
            </Heading>
            <HStack spacing={3} flexWrap="wrap">
              <Button
                bg={accentColor}
                color={mainColor}
                _hover={{ bg: inputBg, color: mainColor }}
                onClick={handleScheduler}
                size="md"
              >
                Schedule for Teacher
              </Button>
              <Button
                bg={accentColor}
                color={mainColor}
                _hover={{ bg: inputBg, color: mainColor }}
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
                _hover={{ bg: accentColor, color: mainColor }}
                onClick={logout}
                size="md"
              >
                Logout
              </Button>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
        <CardBody p={0}>
          <TableContainer>
            <Table variant="simple" bg={inputBg}>
              <Thead>
                <Tr>
                  <Th
                    colSpan={7}
                    textAlign="center"
                    fontSize="xl"
                    fontWeight="bold"
                    bg={mainColor}
                    color={textColor}
                    py={4}
                  >
                    All Requests
                  </Th>
                </Tr>
                <Tr bg={mainColor}>
                  <Th color={textColor}>ID</Th>
                  <Th color={textColor}>Teacher</Th>
                  <Th color={textColor}>Blocks Requested</Th>
                  <Th color={textColor}>Subject</Th>
                  <Th color={textColor}>Room</Th>
                  <Th color={textColor}>Day</Th>
                  <Th color={textColor}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <Tr key={request.id} _hover={{ bg: accentColor, color: mainColor }}>
                      <Td color={mainColor}>{request.id}</Td>
                      <Td color={mainColor}>{`${request.teacher_id} - ${request.first_name} ${request.last_name}`}</Td>
                      <Td color={mainColor}>
                        <List spacing={1} pl={4}>
                          {request.blocks_requested?.split(',').map((block, i) => (
                            <ListItem key={i}>{block.trim()}</ListItem>
                          ))}
                        </List>
                      </Td>
                      <Td color={mainColor}>{request.subject}</Td>
                      <Td color={mainColor}>{request.room}</Td>
                      <Td color={mainColor}>{request.day}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="Edit Request" hasArrow>
                            <IconButton
                              icon={<EditIcon />}
                              bg={accentColor}
                              color={mainColor}
                              _hover={{ bg: inputBg, color: mainColor }}
                              onClick={() => handleEdit(request.id)}
                              aria-label="Edit request"
                            />
                          </Tooltip>
                          <Tooltip label="Delete Request" hasArrow>
                            <IconButton
                              icon={<DeleteIcon />}
                              bg="red.500"
                              color={textColor}
                              _hover={{ bg: 'red.600' }}
                              onClick={() => handleCancel(request.id)}
                              aria-label="Delete request"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={6}>
                      <Alert status="info" justifyContent="center">
                        <AlertIcon color={mainColor} />
                        <Text fontWeight="bold" color={mainColor}>No requests available</Text>
                      </Alert>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AdminHome;




// import { useEffect, useState } from 'react';
// import {
//   Box,
//   Button,
//   Heading,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   TableContainer,
//   Text,
//   HStack,
//   Card,
//   CardBody,
//   List,
//   ListItem,
//   Alert,
//   AlertIcon,
//   IconButton,
//   Tooltip,
//   FormControl,
//   FormLabel,
//   Input,
//   VStack,
//   Spinner,
//   Grid,
//   GridItem,
//   Checkbox,
//   CheckboxGroup,
// } from '@chakra-ui/react';
// import { DeleteIcon, EditIcon, ArrowBackIcon, CheckIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../AuthContext';

// const AdminHome = () => {
//   const [requests, setRequests] = useState([]);
//   const [date, setDate] = useState(null);
//   const [submitted, setSubmitted] = useState(false);
//   const [selfEmail, setSelfEmail] = useState('');
//   const [room, setRoom] = useState('');
//   const [period, setPeriod] = useState([]);
//   const [teacherCaption, setTeacherCaption] = useState('');
//   const [emailAllSubs, setEmailAllSubs] = useState(false);
//   const [subjectSpecificEmails, setSubjectSpecificEmails] = useState([]);
//   const [emailBody, setEmailBody] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [subs, setSubs] = useState([]);
//   const [teachers, setTeachers] = useState([]);
//   const [teacherId, setTeacherId] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchSubQuery, setSearchSubQuery] = useState('');
//   const [filteredTeachers, setFilteredTeachers] = useState([]);
//   const [filteredSubs, setFilteredSubs] = useState([]);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const { user, isAuthenticated, logout } = useAuth();
//   const navigate = useNavigate();

//   // Theme colors
//   const mainColor = 'rgb(20, 54, 100)';
//   const accentColor = 'rgb(175, 214, 241)';
//   const bgColor = 'rgb(30, 64, 110)';
//   const textColor = '#FFFFFF';
//   const inputBg = '#FFFFFF';
//   const listCardBg = 'gray.100';

//   const periods = [
//     '1st Period: 8:19am-9:14am',
//     '2nd Period: 9:52am-11:02am',
//     '3rd Period (flex): 11:06am-12:26pm',
//     '3rd Period (no flex): 11:31am-12:26pm',
//     '4th Period: 1:02pm-1:47pm',
//     '5th Period: 1:51pm-2:46pm',
//   ];

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

//     const fetchData = async () => {
//       try {
//         const [requestsRes, subsRes, teachersRes] = await Promise.all([
//           fetch('http://localhost:3001/get-everything'),
//           fetch('http://localhost:3001/get-subs'),
//           fetch('http://localhost:3001/get-teacher-ids'),
//         ]);

//         if (requestsRes.ok) {
//           setRequests(await requestsRes.json());
//         }
//         if (subsRes.ok) {
//           const result = await subsRes.json();
//           const processedSubs = result.map((sub) => ({
//             id: sub.id,
//             email: sub.email || 'None',
//             firstName: sub.first_name || 'None',
//             lastName: sub.last_name || 'None',
//             tags: sub.tags || sub.departments?.split(',') || ['None'],
//             phoneNumber: sub.phone_number || 'None',
//           }));
//           setSubs(processedSubs);
//           setFilteredSubs(processedSubs);
//         }
//         if (teachersRes.ok) {
//           const result = await teachersRes.json();
//           const processedTeachers = result.map((teacher) => ({
//             id: teacher.id,
//             firstName: teacher.first_name || 'None',
//             lastName: teacher.last_name || 'None',
//             phoneNumber: teacher.phone_number || 'None',
//           }));
//           setTeachers(processedTeachers);
//           setFilteredTeachers(processedTeachers);
//         }
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [user, isAuthenticated, navigate]);

//   const handleEdit = (requestId) => navigate(`/admin-editor?requestId=${requestId}`);
//   const handleAdd = () => navigate('/admin-add');
//   const handleCancel = async (requestId) => {
//     try {
//       const response = await fetch(`http://localhost:3001/requests/${requestId}`, {
//         method: 'DELETE',
//       });
//       if (response.ok) {
//         setRequests(requests.filter((request) => request.id !== requestId));
//       }
//     } catch (err) {
//       console.error('Error deleting request:', err);
//     }
//   };

//   const handleSearchTeachers = (event) => {
//     const query = event.target.value.toLowerCase();
//     setSearchQuery(query);
//     const filtered = teachers.filter((teacher) =>
//       `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(query)
//     );
//     setFilteredTeachers(filtered);
//   };

//   const handleSearchSubs = (event) => {
//     const query = event.target.value.toLowerCase();
//     setSearchSubQuery(query);
//     const filtered = subs.filter((sub) =>
//       `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(query) ||
//       sub.tags.some((tag) => tag.toLowerCase().includes(query))
//     );
//     setFilteredSubs(filtered);
//   };

//   const handleAddToSubjectEmails = (substitute) => {
//     setSubjectSpecificEmails((prev) => [
//       ...prev,
//       { email: substitute.email, firstName: substitute.firstName, lastName: substitute.lastName },
//     ]);
//   };

//   const handleRemoveFromSubjectEmails = (email) => {
//     setSubjectSpecificEmails((prev) => prev.filter((sub) => sub.email !== email));
//   };

//   const handlePeriodChange = (selectedPeriods) => {
//     setPeriod(selectedPeriods);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     const now = new Date();
//     if (date && date < now.setHours(0, 0, 0, 0)) {
//       setError('The selected date must be in the future.');
//       return;
//     }

//     if (!selfEmail || !teacherId || !date || !room || (!emailAllSubs && !subjectSpecificEmails.length)) {
//       setError('All required fields must be filled.');
//       return;
//     }

//     const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//     if (!isValidEmail(selfEmail)) {
//       setError('Invalid email format.');
//       return;
//     }

//     const data = {
//       selfEmail,
//       selectedDate: date.toISOString().split('T')[0],
//       roomNumber: room,
//       selectedPeriod: period.join(', ') || '',
//       teacherCaption: teacherCaption || '',
//       teacherId,
//       emailAllSubs,
//       sendingSubs: emailAllSubs ? [] : subjectSpecificEmails,
//     };

//     try {
//       const response = await fetch('http://localhost:3001/send-substitute-email', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         setEmailBody(result.emailBody);
//         setSubmitted(true);
//       } else {
//         setError(`Server error: ${response.status}`);
//       }
//     } catch (error) {
//       setError('Failed to send request.');
//     }
//   };

//   const getDaysInMonth = (year, month) => {
//     return new Date(year, month + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (year, month) => {
//     return new Date(year, month, 1).getDay();
//   };

//   const handlePrevMonth = () => {
//     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
//   };

//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth();
//   const daysInMonth = getDaysInMonth(year, month);
//   const firstDay = getFirstDayOfMonth(year, month);

//   const calendarDays = [];
//   for (let i = 0; i < firstDay; i++) {
//     calendarDays.push(null);
//   }
//   for (let i = 1; i <= daysInMonth; i++) {
//     calendarDays.push(i);
//   }

//   if (loading) {
//     return (
//       <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
//         <Spinner size="xl" color={accentColor} />
//       </Box>
//     );
//   }

//   return (
//     <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
//       <Card bg={mainColor} boxShadow="lg" borderRadius="lg" mb={6}>
//         <CardBody>
//           <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
//             <Heading size="lg" color={textColor}>
//               Admin Dashboard
//             </Heading>
//             <HStack spacing={3} flexWrap="wrap">
//               <Button
//                 bg={accentColor}
//                 color={mainColor}
//                 _hover={{ bg: inputBg, color: mainColor }}
//                 onClick={handleAdd}
//                 size="md"
//               >
//                 Add User
//               </Button>
//               <Button
//                 bg={inputBg}
//                 color={mainColor}
//                 borderColor={mainColor}
//                 borderWidth={1}
//                 _hover={{ bg: accentColor, color: mainColor }}
//                 onClick={logout}
//                 size="md"
//               >
//                 Logout
//               </Button>
//             </HStack>
//           </HStack>
//         </CardBody>
//       </Card>

//       <Card bg={inputBg} boxShadow="lg" borderRadius="lg" mb={6}>
//         <CardBody>
//           <HStack justify="space-between" mb={4}>
//             <Button onClick={handlePrevMonth} bg={accentColor} color={mainColor}>
//               Previous
//             </Button>
//             <Heading size="md" color={mainColor}>
//               {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
//             </Heading>
//             <Button onClick={handleNextMonth} bg={accentColor} color={mainColor}>
//               Next
//             </Button>
//           </HStack>
//           <Grid templateColumns="repeat(7, 1fr)" gap={2} textAlign="center">
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
//               <Text key={day} fontWeight="bold" color={mainColor}>
//                 {day}
//               </Text>
//             ))}
//             {calendarDays.map((day, index) => {
//               const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
//               const dayRequests = requests.filter((req) => req.day === dateStr);
//               return (
//                 <Box
//                   key={index}
//                   minH="100px"
//                   bg={day ? inputBg : 'gray.200'}
//                   p={2}
//                   borderRadius="md"
//                   border="1px solid"
//                   borderColor={mainColor}
//                   cursor={day ? 'pointer' : 'default'}
//                   _hover={day ? { bg: accentColor } : {}}
//                   onClick={() => day && setDate(new Date(year, month, day))}
//                 >
//                   {day && (
//                     <>
//                       <Text fontWeight="bold" color={mainColor}>
//                         {day}
//                       </Text>
//                       {dayRequests.map((req) => (
//                         <Text key={req.id} fontSize="xs" color={mainColor}>
//                           {req.first_name} {req.last_name} - {req.blocks_requested}
//                         </Text>
//                       ))}
//                     </>
//                   )}
//                 </Box>
//               );
//             })}
//           </Grid>
//         </CardBody>
//       </Card>

//       {date && (
//         <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
//           <CardBody>
//             <HStack justify="space-between" mb={4}>
//               <Heading size="md" color={mainColor}>
//                 Schedule for {date.toLocaleDateString()}
//               </Heading>
//               <Button
//                 onClick={() => setDate(null)}
//                 bg={accentColor}
//                 color={mainColor}
//                 leftIcon={<ArrowBackIcon />}
//               >
//                 Back to Calendar
//               </Button>
//             </HStack>
//             <Grid templateColumns={{ base: '1fr', md: '1fr 2fr 1fr' }} gap={6}>
//               <GridItem>
//                 <Card bg={inputBg} maxH="400px" overflowY="auto">
//                   <CardBody>
//                     <Heading size="md" mb={4} color={mainColor}>
//                       Teacher List
//                     </Heading>
//                     <Input
//                       value={searchQuery}
//                       onChange={handleSearchTeachers}
//                       placeholder="Search teachers"
//                       mb={4}
//                       bg={inputBg}
//                       color={mainColor}
//                       borderColor={mainColor}
//                       _placeholder={{ color: mainColor }}
//                     />
//                     <List spacing={3}>
//                       {(filteredTeachers.length > 0 ? filteredTeachers : teachers).map((teacher) => (
//                         <ListItem key={teacher.id}>
//                           <Card bg={listCardBg} boxShadow="sm">
//                             <CardBody p={3}>
//                               <Text color={mainColor}>{`${teacher.firstName} ${teacher.lastName}: ${teacher.id}`}</Text>
//                             </CardBody>
//                           </Card>
//                         </ListItem>
//                       ))}
//                     </List>
//                   </CardBody>
//                 </Card>
//               </GridItem>

//               <GridItem>
//                 <Card bg={inputBg}>
//                   <CardBody>
//                     <VStack spacing={4} as="form" onSubmit={handleSubmit}>
//                       <FormControl isRequired isInvalid={!!error}>
//                         <FormLabel color={mainColor}>Notification Email</FormLabel>
//                         <Input
//                           value={selfEmail}
//                           onChange={(e) => setSelfEmail(e.target.value)}
//                           placeholder="Enter notification email"
//                           bg={inputBg}
//                           color={mainColor}
//                           borderColor={mainColor}
//                           _placeholder={{ color: mainColor }}
//                         />
//                       </FormControl>

//                       <FormControl isRequired isInvalid={!!error}>
//                         <FormLabel color={mainColor}>Teacher ID</FormLabel>
//                         <Input
//                           value={teacherId}
//                           onChange={(e) => setTeacherId(e.target.value)}
//                           placeholder="Enter teacher ID"
//                           bg={inputBg}
//                           color={mainColor}
//                           borderColor={mainColor}
//                           _placeholder={{ color: mainColor }}
//                         />
//                       </FormControl>

//                       <HStack w="full" spacing={4}>
//                         <FormControl isRequired isInvalid={!!error}>
//                           <FormLabel color={mainColor}>Date</FormLabel>
//                           <Input
//                             type="date"
//                             value={date ? date.toISOString().split('T')[0] : ''}
//                             onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : null)}
//                             min={new Date().toISOString().split('T')[0]}
//                             bg={inputBg}
//                             color={mainColor}
//                             borderColor={mainColor}
//                             _placeholder={{ color: mainColor }}
//                           />
//                         </FormControl>

//                         <FormControl>
//                           <FormLabel color={mainColor}>Email All Substitutes</FormLabel>
//                           <Checkbox
//                             isChecked={emailAllSubs}
//                             onChange={(e) => setEmailAllSubs(e.target.checked)}
//                             color={mainColor}
//                           >
//                             Send to all substitutes
//                           </Checkbox>
//                         </FormControl>
//                       </HStack>

//                       <FormControl isRequired isInvalid={!!error}>
//                         <FormLabel color={mainColor}>Room Number(s)</FormLabel>
//                         <Input
//                           value={room}
//                           onChange={(e) => setRoom(e.target.value)}
//                           placeholder="Enter room number(s)"
//                           bg={inputBg}
//                           color={mainColor}
//                           borderColor={mainColor}
//                           _placeholder={{ color: mainColor }}
//                         />
//                       </FormControl>

//                       <FormControl isInvalid={!!error && error.includes('block')}>
//                         <FormLabel color={mainColor}>Block(s)</FormLabel>
//                         <CheckboxGroup value={period} onChange={handlePeriodChange}>
//                           <VStack align="start" spacing={2}>
//                             {periods.map((p, index) => (
//                               <Checkbox key={index} value={p} color={mainColor}>
//                                 {p}
//                               </Checkbox>
//                             ))}
//                           </VStack>
//                         </CheckboxGroup>
//                       </FormControl>

//                       <FormControl>
//                         <FormLabel color={mainColor}>Message</FormLabel>
//                         <Input
//                           value={teacherCaption}
//                           onChange={(e) => setTeacherCaption(e.target.value)}
//                           placeholder="Enter a message"
//                           minRows={3}
//                           maxRows={10}
//                           as="textarea"
//                           bg={inputBg}
//                           color={mainColor}
//                           borderColor={mainColor}
//                           _placeholder={{ color: mainColor }}
//                         />
//                       </FormControl>

//                       <Card bg={inputBg} p={4} borderRadius="md" w="full" borderColor={mainColor} borderWidth={1}>
//                         <Heading size="sm" mb={2} color={mainColor}>
//                           Subs You Are Emailing
//                         </Heading>
//                         {subjectSpecificEmails.length > 0 ? (
//                           <List spacing={1}>
//                             {subjectSpecificEmails.map((sub, index) => (
//                               <ListItem key={index} color={mainColor}>
//                                 {sub.firstName} {sub.lastName} - {sub.email}
//                               </ListItem>
//                             ))}
//                           </List>
//                         ) : (
//                           <Text color={mainColor}>
//                             {emailAllSubs ? 'All substitutes will be emailed.' : 'No substitutes selected.'}
//                           </Text>
//                         )}
//                       </Card>

//                       {error && (
//                         <Alert status="error">
//                           <AlertIcon color={mainColor} />
//                           <Text color="red.600">{error}</Text>
//                         </Alert>
//                       )}

//                       <Button
//                         type="submit"
//                         bg={accentColor}
//                         color={mainColor}
//                         _hover={{ bg: inputBg, color: mainColor }}
//                         size="lg"
//                         leftIcon={<CheckIcon />}
//                         isDisabled={submitted}
//                         w="full"
//                       >
//                         Submit
//                       </Button>
//                     </VStack>

//                     {emailBody && (
//                       <Box mt={6}>
//                         <Heading size="md" mb={2} color={mainColor}>
//                           Email Preview
//                         </Heading>
//                         <Card bg={inputBg} p={4} boxShadow="lg">
//                           <CardBody>
//                             <Box
//                               dangerouslySetInnerHTML={{ __html: emailBody }}
//                               sx={{ '& > *': { color: mainColor } }}
//                             />
//                           </CardBody>
//                         </Card>
//                       </Box>
//                     )}
//                   </CardBody>
//                 </Card>
//               </GridItem>

//               <GridItem>
//                 <Card bg={inputBg} maxH="400px" overflowY="auto">
//                   <CardBody>
//                     <Heading size="md" mb={4} color={mainColor}>
//                       Available Substitutes
//                     </Heading>
//                     <Input
//                       value={searchSubQuery}
//                       onChange={handleSearchSubs}
//                       placeholder="Search by name or tag"
//                       mb={4}
//                       bg={inputBg}
//                       color={mainColor}
//                       borderColor={mainColor}
//                       _placeholder={{ color: mainColor }}
//                     />
//                     <List spacing={3}>
//                       {(filteredSubs.length > 0 ? filteredSubs : subs).map((sub) => {
//                         const isSelected = subjectSpecificEmails.some((s) => s.email === sub.email);
//                         return (
//                           <ListItem key={sub.id}>
//                             <Card bg={listCardBg} boxShadow="sm" opacity={isSelected ? 0.5 : 1}>
//                               <CardBody p={3}>
//                                 <Text fontWeight="bold" color={mainColor}>{`${sub.firstName} ${sub.lastName}`}</Text>
//                                 <Text fontSize="sm" color={mainColor}>Email: {sub.email}</Text>
//                                 <Text fontSize="sm" color={mainColor}>Tags: {sub.tags.join(', ')}</Text>
//                                 <Text fontSize="sm" color={mainColor}>Phone: {sub.phoneNumber}</Text>
//                                 <HStack mt={2}>
//                                   <Tooltip label="Add to Email List" hasArrow>
//                                     <IconButton
//                                       icon={<AddIcon />}
//                                       bg={accentColor}
//                                       color={mainColor}
//                                       _hover={{ bg: inputBg, color: mainColor }}
//                                       size="sm"
//                                       onClick={() => handleAddToSubjectEmails(sub)}
//                                       aria-label="Add substitute"
//                                       isDisabled={isSelected || emailAllSubs}
//                                     />
//                                   </Tooltip>
//                                   <Tooltip label="Remove from Email List" hasArrow>
//                                     <IconButton
//                                       icon={<MinusIcon />}
//                                       bg="red.500"
//                                       color="#FFFFFF"
//                                       _hover={{ bg: 'red.600' }}
//                                       size="sm"
//                                       onClick={() => handleRemoveFromSubjectEmails(sub.email)}
//                                       aria-label="Remove substitute"
//                                       isDisabled={!isSelected || emailAllSubs}
//                                     />
//                                   </Tooltip>
//                                 </HStack>
//                               </CardBody>
//                             </Card>
//                           </ListItem>
//                         );
//                       })}
//                     </List>
//                   </CardBody>
//                 </Card>
//               </GridItem>
//             </Grid>

//             <TableContainer mt={6}>
//               <Table variant="simple" bg={inputBg}>
//                 <Thead>
//                   <Tr>
//                     <Th colSpan={7} textAlign="center" fontSize="xl" bg={mainColor} color={textColor} py={4}>
//                       Requests for {date.toLocaleDateString()}
//                     </Th>
//                   </Tr>
//                   <Tr bg={mainColor}>
//                     <Th color={textColor}>ID</Th>
//                     <Th color={textColor}>Teacher</Th>
//                     <Th color={textColor}>Blocks Requested</Th>
//                     <Th color={textColor}>Subject</Th>
//                     <Th color={textColor}>Room</Th>
//                     <Th color={textColor}>Day</Th>
//                     <Th color={textColor}>Actions</Th>
//                   </Tr>
//                 </Thead>
//                 <Tbody>
//                   {requests
//                     .filter((req) => req.day === date.toISOString().split('T')[0])
//                     .map((request) => (
//                       <Tr key={request.id} _hover={{ bg: accentColor, color: mainColor }}>
//                         <Td color={mainColor}>{request.id}</Td>
//                         <Td color={mainColor}>{`${request.teacher_id} - ${request.first_name} ${request.last_name}`}</Td>
//                         <Td color={mainColor}>
//                           <List spacing={1} pl={4}>
//                             {request.blocks_requested?.split(',').map((block, i) => (
//                               <ListItem key={i}>{block.trim()}</ListItem>
//                             ))}
//                           </List>
//                         </Td>
//                         <Td color={mainColor}>{request.subject}</Td>
//                         <Td color={mainColor}>{request.room}</Td>
//                         <Td color={mainColor}>{request.day}</Td>
//                         <Td>
//                           <HStack spacing={2}>
//                             <Tooltip label="Edit Request" hasArrow>
//                               <IconButton
//                                 icon={<EditIcon />}
//                                 bg={accentColor}
//                                 color={mainColor}
//                                 _hover={{ bg: inputBg, color: mainColor }}
//                                 onClick={() => handleEdit(request.id)}
//                                 aria-label="Edit request"
//                               />
//                             </Tooltip>
//                             <Tooltip label="Delete Request" hasArrow>
//                               <IconButton
//                                 icon={<DeleteIcon />}
//                                 bg="red.500"
//                                 color={textColor}
//                                 _hover={{ bg: 'red.600' }}
//                                 onClick={() => handleCancel(request.id)}
//                                 aria-label="Delete request"
//                               />
//                             </Tooltip>
//                           </HStack>
//                         </Td>
//                       </Tr>
//                     ))}
//                   {requests.filter((req) => req.day === date.toISOString().split('T')[0]).length === 0 && (
//                     <Tr>
//                       <Td colSpan={7} textAlign="center" py={6}>
//                         <Alert status="info" justifyContent="center">
//                           <AlertIcon color={mainColor} />
//                           <Text fontWeight="bold" color={mainColor}>No requests for this date</Text>
//                         </Alert>
//                       </Td>
//                     </Tr>
//                   )}
//                 </Tbody>
//               </Table>
//             </TableContainer>
//           </CardBody>
//         </Card>
//       )}
//     </Box>
//   );
// };

// export default AdminHome;