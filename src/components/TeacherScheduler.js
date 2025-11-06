import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  Textarea,
  VStack,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Tooltip,
  Checkbox,
  CheckboxGroup,
  Badge,
  GridItem,
  Select,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, CloseIcon, SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const TeacherScheduler = () => {
  const [requestDate, setRequestDate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [subject, setSubject] = useState('');
  const [schoolLevel, setSchoolLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [emailPreview, setEmailPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [substitutes, setSubstitutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSubstitutes, setFilteredSubstitutes] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Theme colors
  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

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

  useEffect(() => {
    const fetchSubstitutes = async () => {
      try {
        const response = await fetch('/api/get-subs');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();
        const processedSubstitutes = result.map(sub => ({
          id: sub.id,
          email: sub.email || 'None',
          firstName: sub.first_name || 'None',
          lastName: sub.last_name || 'None',
          tags: sub.tags || sub.departments?.split(',') || ['None'],
          phoneNumber: sub.phone_number || 'None',
        }));
        setSubstitutes(processedSubstitutes);
        setFilteredSubstitutes(processedSubstitutes);
      } catch (error) {
        console.error('Error fetching substitutes:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch substitutes.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
      }
    };
    fetchSubstitutes();
  }, [toast]);

  const handleSearchSubstitutes = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = substitutes.filter(
      (sub) =>
        `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(query) ||
        sub.tags.some((tag) => tag.toLowerCase().includes(query))
    );
    setFilteredSubstitutes(filtered);
  };

  const handleAddSub = (substitute) => {
    setSelectedSubs((prev) => [
      ...prev,
      {
        email: substitute.email,
        firstName: substitute.firstName,
        lastName: substitute.lastName,
      },
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

  const handleRemoveSub = (email) => {
    setSelectedSubs((prev) => prev.filter((sub) => sub.email !== email));
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
    const allSubs = substitutes.map((sub) => ({
      email: sub.email,
      firstName: sub.firstName,
      lastName: sub.lastName,
    }));
    setSelectedSubs(allSubs);
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

  const handleBlockChange = (values) => setBlocks(values);

  const handleSubjectSelect = (selectedSubject) => {
    setSubject(selectedSubject);
  };

  const handleSchoolLevelChange = (event) => {
    setSchoolLevel(event.target.value);
    setBlocks([]); // Reset blocks when school level changes
  };

  const handleNavigateHome = () => navigate('/teacher-home');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const currentDate = new Date();
    const selectedDate = new Date(requestDate);
    if (requestDate && selectedDate < currentDate.setHours(0, 0, 0, 0)) {
      setFormError('The selected date must be today or in the future.');
      return;
    }
    if (!roomNumber || !requestDate || !subject || !schoolLevel) {
      setFormError('Date, room number, subject, and school level are required.');
      return;
    }

    const formattedSubject = `${schoolLevel}, ${subject}`;

    const payload = {
      teacherEmail: user.email,
      date: requestDate,
      room: roomNumber,
      blocks: blocks.join(', ') || '',
      subject: formattedSubject,
      notes,
      teacherId: user.id,
      selectedSubs,
    };

    try {
      const response = await fetch('/api/send-substitute-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message || 'Request submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          bg: inputBg,
          color: mainColor,
        });
        setEmailPreview(result.emailBody || '');
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending substitute request:', error);
      const errorMessage = error.message || 'Failed to send substitute request.';
      setFormError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        bg: inputBg,
        color: mainColor,
      });
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <Container maxW="container.2xl">
        <HStack justify="space-between" align="center" mb={8}>
          <Heading size="xl" color={'rgb(255, 255, 255)'}>
            Schedule a Substitute
          </Heading>
          <Tooltip label="Return to Home" hasArrow>
            <IconButton
              icon={<ArrowBackIcon />}
              bg={accentColor}
              color={mainColor}
              _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.05)' }}
              transition="all 0.2s"
              onClick={handleNavigateHome}
              aria-label="Back to home"
              size="lg"
            />
          </Tooltip>
        </HStack>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8}>
          <GridItem>
            <Card bg={inputBg} boxShadow="xl" borderRadius="lg" p={4}>
              <CardHeader>
                <Heading size="md" color={mainColor}>
                  Request a Substitute
                </Heading>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleFormSubmit}>
                  <VStack spacing={5} align="stretch">
                    <FormControl isRequired isInvalid={!!formError && !requestDate}>
                      <FormLabel color={mainColor} fontWeight="semibold">
                        Date
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <CalendarIcon color={mainColor} />
                        </InputLeftElement>
                        <Input
                          type="date"
                          value={requestDate}
                          onChange={(e) => setRequestDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          bg={inputBg}
                          color={mainColor}
                          borderColor={mainColor}
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                          pl={10}
                        />
                      </InputGroup>
                      {formError && !requestDate && (
                        <Text color="red.600" fontSize="sm" mt={1}>
                          {formError}
                        </Text>
                      )}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!formError && !roomNumber}>
                      <FormLabel color={mainColor} fontWeight="semibold">
                        Room Number(s)
                      </FormLabel>
                      <Input
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="Enter room number(s)"
                        bg={inputBg}
                        color={mainColor}
                        borderColor={mainColor}
                        _hover={{ borderColor: accentColor }}
                        _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                      />
                      {formError && !roomNumber && (
                        <Text color="red.600" fontSize="sm" mt={1}>
                          {formError}
                        </Text>
                      )}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!formError && !schoolLevel}>
                      <FormLabel color={mainColor} fontWeight="semibold">
                        School Level
                      </FormLabel>
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
                      {formError && !schoolLevel && (
                        <Text color="red.600" fontSize="sm" mt={1}>
                          {formError}
                        </Text>
                      )}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!formError && !subject}>
                      <FormLabel color={mainColor} fontWeight="semibold">
                        Subject
                      </FormLabel>
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
                      {formError && !subject && (
                        <Text color="red.600" fontSize="sm" mt={1}>
                          {formError}
                        </Text>
                      )}
                    </FormControl>
                    <FormControl>
                      <FormLabel color={mainColor} fontWeight="semibold">
                        Block(s)
                      </FormLabel>
                      <CheckboxGroup value={blocks} onChange={handleBlockChange}>
                        <VStack align="start" spacing={2} p={2}>
                          {(schoolLevel ? schedules[schoolLevel] : []).map((p, index) => (
                            <Checkbox
                              key={index}
                              value={p}
                              color={mainColor}
                              _hover={{ bg: accentColor, borderRadius: 'md' }}
                              isDisabled={!schoolLevel}
                            >
                              {p}
                            </Checkbox>
                          ))}
                        </VStack>
                      </CheckboxGroup>
                    </FormControl>
                    <FormControl>
                      <FormLabel color={mainColor} fontWeight="semibold">
                        Notes
                      </FormLabel>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter a message for the substitute"
                        minRows={4}
                        bg={inputBg}
                        color={mainColor}
                        borderColor={mainColor}
                        _hover={{ borderColor: accentColor }}
                        _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                      />
                    </FormControl>
                    {formError && (
                      <Alert status="error" bg={inputBg} borderRadius="md">
                        <AlertIcon color={mainColor} />
                        <Text color={mainColor}>{formError}</Text>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      bgGradient="linear(to-r, rgb(175, 214, 241), rgb(100, 150, 200))"
                      color={mainColor}
                      _hover={{
                        bgGradient: 'linear(to-r, rgb(200, 230, 255), rgb(120, 170, 220))',
                        transform: 'scale(1.02)',
                      }}
                      _active={{ transform: 'scale(0.98)' }}
                      transition="all 0.2s"
                      isDisabled={isSubmitted}
                      leftIcon={<CheckIcon />}
                      size="md"
                    >
                      Submit Request
                    </Button>
                  </VStack>
                </form>
                {emailPreview && (
                  <Box mt={8}>
                    <Heading size="sm" mb={3} color={mainColor}>
                      Email Preview
                    </Heading>
                    <Card bg={inputBg} boxShadow="xl" borderRadius="lg" p={4}>
                      <CardBody>
                        <Box
                          dangerouslySetInnerHTML={{ __html: emailPreview }}
                          sx={{
                            '& > *': { color: mainColor, fontSize: 'sm' },
                            h2: { fontSize: 'lg', fontWeight: 'bold', mb: 2 },
                            p: { mb: 1 },
                          }}
                        />
                      </CardBody>
                    </Card>
                  </Box>
                )}
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={inputBg} boxShadow="xl" borderRadius="lg" p={4} maxH="600px" overflowY="auto">
              <CardHeader>
                <Heading size="md" color={mainColor}>
                  Available Substitutes
                </Heading>
              </CardHeader>
              <CardBody>
                <HStack mb={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color={mainColor} />
                    </InputLeftElement>
                    <Input
                      value={searchQuery}
                      onChange={handleSearchSubstitutes}
                      placeholder="Search by name or tag"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                      pl={10}
                    />
                  </InputGroup>
                  <Tooltip label="Select all substitutes" hasArrow>
                    <Button
                      size="sm"
                      bg={accentColor}
                      color={mainColor}
                      _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                      onClick={handleSelectAllSubs}
                      leftIcon={<CheckIcon />}
                    >
                      Select All
                    </Button>
                  </Tooltip>
                </HStack>
                <List spacing={3}>
                  {(filteredSubstitutes.length > 0 ? filteredSubstitutes : substitutes).map((sub) => {
                    const isSelected = selectedSubs.some((s) => s.email === sub.email);
                    return (
                      <ListItem key={sub.id}>
                        <Card
                          bg={inputBg}
                          boxShadow="md"
                          borderRadius="md"
                          borderWidth={1}
                          borderColor={mainColor}
                          opacity={isSelected ? 0.6 : 1}
                          transition="opacity 0.2s"
                        >
                          <CardBody p={3}>
                            <Grid templateColumns="2fr 1fr" gap={3} alignItems="center">
                              <Box>
                                <Text fontWeight="bold" color={mainColor} fontSize="sm">
                                  {`${sub.firstName} ${sub.lastName}`}
                                </Text>
                                <Text fontSize="xs" color={mainColor}>
                                  Email: {sub.email}
                                </Text>
                                <Text fontSize="xs" color={mainColor}>
                                  Tags:{' '}
                                  {sub.tags.map((tag, idx) => (
                                    <Badge
                                      key={idx}
                                      colorScheme="blue"
                                      variant="subtle"
                                      mr={1}
                                      fontSize="2xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </Text>
                                <Text fontSize="xs" color={mainColor}>
                                  Phone: {sub.phoneNumber}
                                </Text>
                              </Box>
                              <HStack justify="flex-end">
                                <Tooltip label="Add to chosen substitutes" hasArrow>
                                  <Button
                                    size="sm"
                                    bg={accentColor}
                                    color={mainColor}
                                    _hover={{ bg: inputBg, color: mainColor, transform: 'scale(1.05)' }}
                                    transition="all 0.2s"
                                    onClick={() => handleAddSub(sub)}
                                    leftIcon={<CheckIcon />}
                                    isDisabled={isSelected}
                                  >
                                    Add
                                  </Button>
                                </Tooltip>
                                <Tooltip label="Remove from chosen substitutes" hasArrow>
                                  <Button
                                    size="sm"
                                    bg="red.500"
                                    color="white"
                                    _hover={{ bg: 'red.600', transform: 'scale(1.05)' }}
                                    transition="all 0.2s"
                                    onClick={() => handleRemoveSub(sub.email)}
                                    leftIcon={<CloseIcon />}
                                    isDisabled={!isSelected}
                                  >
                                    Remove
                                  </Button>
                                </Tooltip>
                              </HStack>
                            </Grid>
                          </CardBody>
                        </Card>
                      </ListItem>
                    );
                  })}
                </List>
              </CardBody>
            </Card>
            <Card bg={inputBg} boxShadow="xl" borderRadius="lg" mt={4} p={4}>
              <CardHeader>
                <Heading size="md" color={mainColor}>
                  Chosen Substitutes
                </Heading>
              </CardHeader>
              <CardBody>
                {selectedSubs.length > 0 ? (
                  <List spacing={2}>
                    {selectedSubs.map((sub, index) => (
                      <ListItem key={index} color={mainColor} fontSize="sm">
                        <Text>{`${sub.firstName} ${sub.lastName} - ${sub.email}`}</Text>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text color={mainColor} fontSize="sm">
                    No substitutes chosen.
                  </Text>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherScheduler;