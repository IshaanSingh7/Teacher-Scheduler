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
  CardBody,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  Spinner,
  Select,
  GridItem,
  CheckboxGroup,
  Checkbox,
  Badge
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const TeacherScheduler = () => {
  const [requestDate, setRequestDate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [emailPreview, setEmailPreview] = useState('');
  const [formError, setFormError] = useState('');

  // Data Lists
  const [substitutes, setSubstitutes] = useState([]);
  const [filteredSubstitutes, setFilteredSubstitutes] = useState([]);
  const [subSearchQuery, setSubSearchQuery] = useState('');

  // Admin/Chair States
  const [adminEmail, setAdminEmail] = useState('');
  const [availableChairs, setAvailableChairs] = useState([]);
  const [backupChairs, setBackupChairs] = useState([]);
  const [isSearchingChairs, setIsSearchingChairs] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  const subjects = [
    'History', 'Theatre', 'Modern Languages', 'Mathematics', 'Computer Science', 'English', 'Stone Family Science', 'Religion', 'Visual Art', 'Classics', 'Music', 'Miscellaneous'
  ];

  // Combined Schedule with School Identifiers (matching Admin nuance)
  const allBlocks = [
    { label: '1st Period: 8:19am-9:14am (US)', value: 'US - 1st Period' },
    { label: '2nd Period: 9:52am-11:02am (US)', value: 'US - 2nd Period' },
    { label: '3rd Period (flex): 11:06am-12:26pm (US)', value: 'US - 3rd Period (flex)' },
    { label: '3rd Period (no flex): 11:31am-12:26pm (US)', value: 'US - 3rd Period (no flex)' },
    { label: '4th Period: 1:02pm-1:47pm (US)', value: 'US - 4th Period' },
    { label: '5th Period: 1:51pm-2:46pm (US)', value: 'US - 5th Period' },
    { label: '1st Period: 8:19am-9:14am (MS)', value: 'MS - 1st Period' },
    { label: '2nd Period: 10:02am-11:02am (MS)', value: 'MS - 2nd Period' },
    { label: '3rd Period: 11:06am-11:56am (MS)', value: 'MS - 3rd Period' },
    { label: '4th Period (no flex): 12:50pm-1:47pm (MS)', value: 'MS - 4th Period (no flex)' },
    { label: '4th Period (flex): 12:26pm-1:47pm (MS)', value: 'MS - 4th Period (flex)' },
    { label: '5th Period: 1:51pm-2:46pm (MS)', value: 'MS - 5th Period' },
  ];

  useEffect(() => {
    document.title = "Teacher Scheduler";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsRes, chairsRes] = await Promise.all([
          fetch('/api/get-subs'),
          fetch('/api/get-chairs')
        ]);
        if (subsRes.ok) {
          const data = await subsRes.json();
          setSubstitutes(data);
          setFilteredSubstitutes(data);
        }
        if (chairsRes.ok) setBackupChairs(await chairsRes.json());
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const findChair = async () => {
      if (!subject || subject === 'Miscellaneous') {
        setAvailableChairs([]);
        setAdminEmail('');
        return;
      }
      setIsSearchingChairs(true);
      try {
        const response = await fetch(`/api/find-dept-chair?subject=${encodeURIComponent(subject)}`);
        const chairs = await response.json();
        setAvailableChairs(chairs);
        if (chairs.length === 1) setAdminEmail(chairs[0].email);
        else setAdminEmail('');
      } catch (error) { console.error(error); }
      finally { setIsSearchingChairs(false); }
    };
    findChair();
  }, [subject]);

  const handleBlocksChange = (selectedValues) => {
    if (selectedValues.length <= 5) {
      setBlocks(selectedValues);
    } else {
      toast({
        title: "Limit Reached",
        description: "You can select a maximum of 5 blocks.",
        status: "info",
        duration: 2500,
      });
    }
  };

  const handleSearchSubs = (e) => {
    const q = e.target.value.toLowerCase();
    setSubSearchQuery(q);
    setFilteredSubstitutes(substitutes.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      (s.departments && s.departments.toLowerCase().includes(q))
    ));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Strict validation
    if (blocks.length === 0) {
      setFormError('Please select at least one block.');
      return;
    }

    if (!roomNumber || !requestDate || !subject || !adminEmail) {
      setFormError('All fields including Date, Room, Subject, and Dept Chair are required.');
      return;
    }

    const payload = {
      teacherEmail: user.email,
      date: requestDate,
      room: roomNumber,
      blocks: blocks.join(', '),
      subject: `Teacher Request, ${subject}`,
      notes,
      teacherId: user.id,
      selectedSubs,
      adminEmail
    };

    try {
      const response = await fetch('/api/send-substitute-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Request Sent', status: 'success', duration: 5000 });
        setEmailPreview(result.emailBody || '');
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Submission failed');
      }
    } catch (error) {
      setFormError('Server error. Please try again.');
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <Container maxW="container.2xl">
        <HStack justify="space-between" mb={8}>
          <Heading size="xl" color="white">Schedule a Substitute</Heading>
          <IconButton icon={<ArrowBackIcon />} onClick={() => navigate('/teacher-home')} aria-label="Home" />
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
          <GridItem>
            <Card bg={inputBg} p={6} borderRadius="lg" boxShadow="xl">
              <form onSubmit={handleFormSubmit}>
                <VStack spacing={5} align="stretch">
                  <FormControl isRequired>
                    <FormLabel color={mainColor} fontWeight="bold">Date</FormLabel>
                    <Input type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} color={mainColor} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={mainColor} fontWeight="bold">Room Number(s)</FormLabel>
                    <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} color={mainColor} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={mainColor} fontWeight="bold">Subject</FormLabel>
                    <Wrap spacing={2}>
                      {subjects.map(subj => (
                        <Tag key={subj} size="lg" variant={subject === subj ? 'solid' : 'outline'} colorScheme="blue" cursor="pointer" onClick={() => setSubject(subj)}>
                          <TagLabel>{subj}</TagLabel>
                        </Tag>
                      ))}
                    </Wrap>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={mainColor} fontWeight="bold">Department Chair</FormLabel>
                    {isSearchingChairs ? <Spinner size="sm" /> :
                      availableChairs.length === 1 ? (
                        <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <Text fontWeight="bold">Chair Identified:</Text>
                                <Text fontSize="sm">{availableChairs[0].first_name} {availableChairs[0].last_name} ({availableChairs[0].departments})</Text>
                            </Box>
                        </Alert>
                      ) : (
                        <Select
                          placeholder="Select Chair Manually"
                          value={adminEmail}
                          onChange={e => setAdminEmail(e.target.value)}
                          borderColor="orange.400"
                          borderWidth={2}
                          color={mainColor}
                        >
                          {(availableChairs.length > 0 ? availableChairs : backupChairs).map(c => (
                            <option key={c.email} value={c.email}>
                              {c.first_name} {c.last_name} ({c.departments || 'Admin'})
                            </option>
                          ))}
                        </Select>
                      )
                    }
                  </FormControl>

                  {/* BLOCK SELECTION: Removed isRequired to prevent native browser tooltip errors */}
                  <FormControl isInvalid={formError.includes('block')}>
                    <FormLabel color={mainColor} fontWeight="bold">
                        Block(s) <Badge colorScheme={blocks.length > 0 ? "green" : "gray"} ml={2}>{blocks.length}/5 Selected</Badge>
                    </FormLabel>
                    <Box border="1px solid #E2E8F0" borderRadius="md" p={3} maxH="300px" overflowY="auto">
                        <CheckboxGroup value={blocks} onChange={handleBlocksChange}>
                            <Grid templateColumns="repeat(1, 1fr)" gap={2}>
                                {allBlocks.map((b) => (
                                    <Checkbox 
                                        key={b.value} 
                                        value={b.value} 
                                        color={mainColor} 
                                        fontWeight="medium"
                                        isDisabled={blocks.length >= 5 && !blocks.includes(b.value)}
                                    >
                                        {b.label}
                                    </Checkbox>
                                ))}
                            </Grid>
                        </CheckboxGroup>
                    </Box>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={mainColor} fontWeight="bold">Notes</FormLabel>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} color={mainColor} />
                  </FormControl>

                  {formError && <Alert status="error" borderRadius="md"><AlertIcon />{formError}</Alert>}
                  <Button type="submit" colorScheme="blue" size="lg" isDisabled={isSubmitted} leftIcon={<CheckIcon />}>Submit Request</Button>
                </VStack>
              </form>
              {emailPreview && <Box mt={8} dangerouslySetInnerHTML={{ __html: emailPreview }} p={4} border="1px solid #eee" borderRadius="md" />}
            </Card>
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Card bg={inputBg} p={4} borderRadius="lg" boxShadow="lg">
                <HStack justify="space-between" mb={4}>
                  <Heading size="md" color={mainColor}>Search Substitutes</Heading>
                  <Button size="xs" onClick={() => setSelectedSubs(selectedSubs.length === filteredSubstitutes.length ? [] : filteredSubstitutes)}>
                    Select All Visible
                  </Button>
                </HStack>
                <InputGroup mb={4}>
                  <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
                  <Input placeholder="Search subs..." value={subSearchQuery} onChange={handleSearchSubs} />
                </InputGroup>
                <List spacing={2} maxH="350px" overflowY="auto">
                  {filteredSubstitutes.map(s => {
                    const isAdded = selectedSubs.some(x => x.email === s.email);
                    return (
                      <ListItem key={s.email} display="flex" justifyContent="space-between" p={2} borderBottom="1px solid #edf2f7">
                        <Box>
                          <Text fontSize="sm" fontWeight="bold">{s.first_name} {s.last_name}</Text>
                          <Text fontSize="xs" color="gray.500">{s.departments}</Text>
                        </Box>
                        <Button size="xs" colorScheme={isAdded ? "red" : "blue"} onClick={() => isAdded ? setSelectedSubs(selectedSubs.filter(x => x.email !== s.email)) : setSelectedSubs([...selectedSubs, s])}>
                          {isAdded ? "Remove" : "Add"}
                        </Button>
                      </ListItem>
                    );
                  })}
                </List>
              </Card>

              <Card bg={inputBg} p={4} borderRadius="lg" boxShadow="md">
                <Heading size="sm" mb={3} color={mainColor}>Chosen Substitutes</Heading>
                <Wrap>
                  {selectedSubs.map(s => (
                    <Tag key={s.email} colorScheme="blue">
                      <TagLabel>{s.first_name} {s.last_name}</TagLabel>
                      <TagCloseButton onClick={() => setSelectedSubs(selectedSubs.filter(x => x.email !== s.email))} />
                    </Tag>
                  ))}
                  {selectedSubs.length === 0 && <Text fontSize="sm" color="gray.400 italic">No substitutes selected.</Text>}
                </Wrap>
              </Card>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherScheduler;