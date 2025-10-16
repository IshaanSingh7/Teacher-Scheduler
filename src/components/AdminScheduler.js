import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  HStack,
  Card,
  CardBody,
  List,
  ListItem,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Grid,
  GridItem,
  Checkbox,
  CheckboxGroup,
  IconButton,
  Tooltip,
  Select,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminScheduler = () => {
  const [date, setDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selfEmail, setSelfEmail] = useState('');
  const [room, setRoom] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [schoolLevel, setSchoolLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherCaption, setTeacherCaption] = useState('');
  const [emailAllSubs, setEmailAllSubs] = useState(false);
  const [subjectSpecificEmails, setSubjectSpecificEmails] = useState([]);
  const [emailBody, setEmailBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubQuery, setSearchSubQuery] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // Theme colors
  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';
  const listCardBg = 'gray.100';

  const schedules = {
    US: [
      '1st Period: 8:19am-9:14am',
      '2nd Period: 9:52am-11:02am',
      '3rd Period (flex): 11:06am-12:26pm',
      '3rd Period (no flex): 11:31am-12:26pm',
      '4th Period: 1:02pm-1:47pm',
      '5th Period: 1:51pm-2:46pm',
    ],
    MS: [
      '1st Period: 8:19am-9:14am',
      '2nd Period: 10:02am-11:02am',
      '3rd Period: 11:06am-11:56am',
      '4th Period (no flex): 12:50pm-1:47pm',
      '4th Period (flex): 12:26pm-1:47pm',
      '5th Period: 1:51pm-2:46pm',
    ],
  };

  const subjects = [
    'History',
    'Art',
    'World Languages',
    'Math',
    'Computer Science',
    'English',
    'Science',
    'Music',
    'Other',
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchSubs = async () => {
      try {
        const response = await fetch('http://localhost:3001/get-subs');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();
        const processedSubs = result.map((sub) => ({
          id: sub.id,
          email: sub.email || 'None',
          firstName: sub.first_name || 'None',
          lastName: sub.last_name || 'None',
          tags: sub.tags || sub.departments?.split(',') || ['None'],
          phoneNumber: sub.phone_number || 'None',
        }));
        setSubs(processedSubs);
        setFilteredSubs(processedSubs);
      } catch (error) {
        console.error('Error fetching subs:', error);
      }
    };

    const fetchTeachers = async () => {
      try {
        const response = await fetch('http://localhost:3001/get-teacher-ids');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();
        const processedTeachers = result.map((teacher) => ({
          id: teacher.id,
          firstName: teacher.first_name || 'None',
          lastName: teacher.last_name || 'None',
          phoneNumber: teacher.phone_number || 'None',
        }));
        setTeachers(processedTeachers);
        setFilteredTeachers(processedTeachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubs();
    fetchTeachers();
  }, [isAuthenticated, navigate]);

  const handleSearchTeachers = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = teachers.filter((teacher) =>
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(query)
    );
    setFilteredTeachers(filtered);
  };

  const handleSearchSubs = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchSubQuery(query);
    const filtered = subs.filter(
      (sub) =>
        `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(query) ||
        sub.tags.some((tag) => tag.toLowerCase().includes(query))
    );
    setFilteredSubs(filtered);
  };

  const handleAddToSubjectEmails = (substitute) => {
    setSubjectSpecificEmails((prev) => [
      ...prev,
      { email: substitute.email, firstName: substitute.firstName, lastName: substitute.lastName },
    ]);
    toast({
      title: 'Substitute Added',
      description: `${substitute.firstName} ${substitute.lastName} added to chosen substitutes.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
      bg: inputBg,
      color: mainColor,
    });
  };

  const handleRemoveFromSubjectEmails = (email) => {
    setSubjectSpecificEmails((prev) => prev.filter((sub) => sub.email !== email));
    toast({
      title: 'Substitute Removed',
      description: 'Substitute removed from chosen substitutes.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      bg: inputBg,
      color: mainColor,
    });
  };

  const handleSelectAllSubs = () => {
    const allSubs = subs.map((sub) => ({
      email: sub.email,
      firstName: sub.firstName,
      lastName: sub.lastName,
    }));
    setSubjectSpecificEmails(allSubs);
    toast({
      title: 'All Substitutes Selected',
      description: 'All available substitutes added to chosen substitutes.',
      status: 'success',
      duration: 3000,
      isClosable: true,
      bg: inputBg,
      color: mainColor,
    });
  };

  const handleBlockChange = (selectedBlocks) => {
    setBlocks(selectedBlocks);
  };

  const handleTeacherSelect = (teacher) => {
    if (selectedTeacher && selectedTeacher.id === teacher.id) {
      setSelectedTeacher(null);
      setTeacherId('');
    } else {
      setSelectedTeacher(teacher);
      setTeacherId(teacher.id);
    }
  };

  const handleSchoolLevelChange = (event) => {
    setSchoolLevel(event.target.value);
    setBlocks([]); // Reset blocks when school level changes
  };

  const handleSubjectSelect = (selectedSubject) => {
    setSubject(selectedSubject);
  };

  const handleHome = () => {
    navigate('/admin-home');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const currentDate = new Date();
    const selectedDate = new Date(date);
    if (date && selectedDate < currentDate.setHours(0, 0, 0, 0)) {
      setError('The selected date must be today or in the future.');
      toast({
        title: 'Error',
        description: 'The selected date must be today or in the future.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!selfEmail) {
      setError('Notification email is required.');
      toast({
        title: 'Error',
        description: 'Notification email is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!teacherId) {
      setError('Teacher selection is required.');
      toast({
        title: 'Error',
        description: 'Teacher selection is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!date) {
      setError('Date is required.');
      toast({
        title: 'Error',
        description: 'Date is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!room) {
      setError('Room number is required.');
      toast({
        title: 'Error',
        description: 'Room number is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!schoolLevel) {
      setError('School level is required.');
      toast({
        title: 'Error',
        description: 'School level is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!subject) {
      setError('Subject is required.');
      toast({
        title: 'Error',
        description: 'Subject is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    if (!emailAllSubs && !subjectSpecificEmails.length) {
      setError('Select at least one substitute or check "Email All Substitutes".');
      toast({
        title: 'Error',
        description: 'Select at least one substitute or check "Email All Substitutes".',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail(selfEmail)) {
      setError('Invalid email format.');
      toast({
        title: 'Error',
        description: 'Invalid email format.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
      return;
    }

    const formattedSubject = `${schoolLevel}, ${subject}`;
    const data = {
      teacherEmail: selectedTeacher.email || selfEmail,
      date,
      room,
      blocks: blocks.join(', ') || '',
      subject: formattedSubject,
      notes: teacherCaption,
      teacherId,
      selectedSubs: emailAllSubs ? [] : subjectSpecificEmails,
    };

    try {
      const response = await fetch('http://localhost:3001/send-substitute-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailBody(result.emailBody);
        setSubmitted(true);
        toast({
          title: 'Success',
          description: 'Substitute request sent successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
          bg: inputBg,
          color: 'green.500',
        });
      } else {
        const errorText = await response.text();
        const errorMessage = `Server error: ${response.status} - ${errorText || 'Not Found'}`;
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
          bg: inputBg,
          color: 'red.600',
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      const errorMessage = 'Failed to send request. Check server availability.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
        bg: inputBg,
        color: 'red.600',
      });
    }
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
      <Card bg={mainColor} boxShadow="lg" borderRadius="lg" mb={6}>
        <CardBody>
          <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
            <Heading size="lg" color="#FFFFFF">
              Schedule a Day
            </Heading>
            <Button
              leftIcon={<ArrowBackIcon />}
              bg={accentColor}
              color={mainColor}
              _hover={{ bg: inputBg, color: mainColor }}
              onClick={handleHome}
              size="md"
            >
              Home
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr 1fr' }} gap={6}>
        <GridItem>
          <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxH="400px" overflowY="auto">
            <CardBody>
              <Heading size="md" mb={4} color={mainColor}>
                Teacher List
              </Heading>
              <Input
                value={searchQuery}
                onChange={handleSearchTeachers}
                placeholder="Search teachers"
                mb={4}
                bg={inputBg}
                color={mainColor}
                borderColor={mainColor}
                _placeholder={{ color: mainColor }}
              />
              <List spacing={3}>
                {(filteredTeachers.length > 0 ? filteredTeachers : teachers).map((teacher) => (
                  <ListItem key={teacher.id}>
                    <Button
                      bg={selectedTeacher && selectedTeacher.id === teacher.id ? accentColor : listCardBg}
                      color={mainColor}
                      _hover={{ bg: inputBg, color: mainColor }}
                      opacity={selectedTeacher && selectedTeacher.id !== teacher.id ? 0.5 : 1}
                      onClick={() => handleTeacherSelect(teacher)}
                      w="full"
                      justifyContent="flex-start"
                      p={3}
                    >
                      {`${teacher.firstName} ${teacher.lastName}`}
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
            <CardBody>
              <VStack spacing={4} as="form" onSubmit={handleSubmit}>
                <FormControl isRequired isInvalid={!!error && !selfEmail}>
                  <FormLabel color={mainColor}>Notification Email</FormLabel>
                  <Input
                    value={selfEmail}
                    onChange={(e) => setSelfEmail(e.target.value)}
                    placeholder="Enter notification email"
                    bg={inputBg}
                    color={mainColor}
                    borderColor={mainColor}
                    _placeholder={{ color: mainColor }}
                  />
                </FormControl>

                <FormControl isRequired isInvalid={!!error && !teacherId}>
                  <FormLabel color={mainColor}>Teacher Name</FormLabel>
                  <Text color={mainColor}>
                    {selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : 'Not Selected'}
                  </Text>
                </FormControl>

                <HStack w="full" spacing={4}>
                  <FormControl isRequired isInvalid={!!error && !date}>
                    <FormLabel color={mainColor}>Date</FormLabel>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      placeholder="Select date"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>

                  <FormControl isRequired isInvalid={!!error && !schoolLevel}>
                    <FormLabel color={mainColor}>School Level</FormLabel>
                    <Select
                      placeholder="Select school level"
                      value={schoolLevel}
                      onChange={handleSchoolLevelChange}
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    >
                      <option value="US">Upper School (US)</option>
                      <option value="MS">Middle School (MS)</option>
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl isRequired isInvalid={!!error && !subject}>
                  <FormLabel color={mainColor}>Subject</FormLabel>
                  <Wrap spacing={2}>
                    {subjects.map((subj) => (
                      <WrapItem key={subj}>
                        <Tag
                          size="lg"
                          variant={subject === subj ? 'solid' : 'outline'}
                          colorScheme={subject === subj ? 'blue' : 'gray'}
                          cursor="pointer"
                          onClick={() => handleSubjectSelect(subj)}
                        >
                          <TagLabel>{subj}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </FormControl>

                <FormControl isRequired isInvalid={!!error && !room}>
                  <FormLabel color={mainColor}>Room Number(s)</FormLabel>
                  <Input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Enter room number(s)"
                    bg={inputBg}
                    color={mainColor}
                    borderColor={mainColor}
                    _placeholder={{ color: mainColor }}
                  />
                </FormControl>

                <FormControl isInvalid={!!error && error.includes('block')}>
                  <FormLabel color={mainColor}>Block(s)</FormLabel>
                  <CheckboxGroup value={blocks} onChange={handleBlockChange}>
                    <VStack align="start" spacing={2}>
                      {(schoolLevel ? schedules[schoolLevel] : []).map((p, index) => (
                        <Checkbox
                          key={index}
                          value={p}
                          color={mainColor}
                          isDisabled={!schoolLevel}
                        >
                          {p}
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                  {!!error && error.includes('block') && (
                    <Text color="red.600" fontSize="sm" mt={1}>
                      {error}
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel color={mainColor}>Message</FormLabel>
                  <Input
                    value={teacherCaption}
                    onChange={(e) => setTeacherCaption(e.target.value)}
                    placeholder="Enter a message"
                    minRows={3}
                    maxRows={10}
                    as="textarea"
                    bg={inputBg}
                    color={mainColor}
                    borderColor={mainColor}
                    _placeholder={{ color: mainColor }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={mainColor}>Email All Substitutes</FormLabel>
                  <Checkbox
                    isChecked={emailAllSubs}
                    onChange={(e) => setEmailAllSubs(e.target.checked)}
                    color={mainColor}
                  >
                    Send to all substitutes
                  </Checkbox>
                </FormControl>

                <Card bg={inputBg} p={4} borderRadius="md" w="full" borderColor={mainColor} borderWidth={1}>
                  <Heading size="sm" mb={2} color={mainColor}>
                    Subs You Are Emailing
                  </Heading>
                  {subjectSpecificEmails.length > 0 ? (
                    <List spacing={1}>
                      {subjectSpecificEmails.map((sub, index) => (
                        <ListItem key={index} color={mainColor}>
                          {sub.firstName} {sub.lastName} - {sub.email}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text color={mainColor}>
                      {emailAllSubs ? 'All substitutes will be emailed.' : 'No substitutes selected.'}
                    </Text>
                  )}
                </Card>

                {error && (
                  <Alert status="error">
                    <AlertIcon color={mainColor} />
                    <Text color="red.600">{error}</Text>
                  </Alert>
                )}

                <Button
                  type="submit"
                  bg={accentColor}
                  color={mainColor}
                  _hover={{ bg: inputBg, color: mainColor }}
                  size="lg"
                  leftIcon={<CheckIcon />}
                  isDisabled={submitted}
                  w="full"
                >
                  Submit
                </Button>
              </VStack>

              {emailBody && (
                <Box mt={6}>
                  <Heading size="md" mb={2} color={mainColor}>
                    Email Preview
                  </Heading>
                  <Card bg={inputBg} p={4} boxShadow="lg">
                    <CardBody>
                      <Box
                        dangerouslySetInnerHTML={{ __html: emailBody }}
                        sx={{ '& > *': { color: mainColor } }}
                      />
                    </CardBody>
                  </Card>
                </Box>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxH="400px" overflowY="auto">
            <CardBody>
              <Heading size="md" mb={4} color={mainColor}>
                Available Substitutes
              </Heading>
              <HStack mb={4}>
                <Input
                  value={searchSubQuery}
                  onChange={handleSearchSubs}
                  placeholder="Search by name or tag"
                  bg={inputBg}
                  color={mainColor}
                  borderColor={mainColor}
                  _placeholder={{ color: mainColor }}
                />
                <Tooltip label="Select all substitutes" hasArrow>
                  <Button
                    size="sm"
                    bg={accentColor}
                    color={mainColor}
                    _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                    onClick={handleSelectAllSubs}
                    leftIcon={<CheckIcon />}
                    isDisabled={emailAllSubs || subjectSpecificEmails.length === subs.length}
                  >
                    Select All
                  </Button>
                </Tooltip>
              </HStack>
              <List spacing={3}>
                {(filteredSubs.length > 0 ? filteredSubs : subs).map((sub) => {
                  const isSelected = subjectSpecificEmails.some((s) => s.email === sub.email);
                  return (
                    <ListItem key={sub.id}>
                      <Card bg={listCardBg} boxShadow="sm" opacity={isSelected ? 0.5 : 1}>
                        <CardBody p={3}>
                          <Text fontWeight="bold" color={mainColor}>{`${sub.firstName} ${sub.lastName}`}</Text>
                          <Text fontSize="sm" color={mainColor}>Email: {sub.email}</Text>
                          <Text fontSize="sm" color={mainColor}>Tags: {sub.tags.join(', ')}</Text>
                          <Text fontSize="sm" color={mainColor}>Phone: {sub.phoneNumber}</Text>
                          <HStack mt={2}>
                            <Tooltip label="Add to Email List" hasArrow>
                              <IconButton
                                icon={<AddIcon />}
                                bg={accentColor}
                                color={mainColor}
                                _hover={{ bg: inputBg, color: mainColor }}
                                size="sm"
                                onClick={() => handleAddToSubjectEmails(sub)}
                                aria-label="Add substitute"
                                isDisabled={isSelected || emailAllSubs}
                              />
                            </Tooltip>
                            <Tooltip label="Remove from Email List" hasArrow>
                              <IconButton
                                icon={<MinusIcon />}
                                bg="red.500"
                                color="#FFFFFF"
                                _hover={{ bg: 'red.600' }}
                                size="sm"
                                onClick={() => handleRemoveFromSubjectEmails(sub.email)}
                                aria-label="Remove substitute"
                                isDisabled={!isSelected || emailAllSubs}
                              />
                            </Tooltip>
                          </HStack>
                        </CardBody>
                      </Card>
                    </ListItem>
                  );
                })}
              </List>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AdminScheduler;