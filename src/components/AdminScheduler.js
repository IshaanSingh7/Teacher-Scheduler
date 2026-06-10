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
  Checkbox,
  CheckboxGroup,
  Badge,
  GridItem,
  Select,
  Tag,
  TagLabel,
  Wrap,
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  CheckIcon,
  SearchIcon,
  CalendarIcon,
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminScheduler = () => {
  const [requestDate, setRequestDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [formError, setFormError] = useState('');

  const [substitutes, setSubstitutes] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [subSearchQuery, setSubSearchQuery] = useState('');

  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailPreview, setEmailPreview] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [chairs, setChairs] = useState([]);
  const [selectedChairEmail, setSelectedChairEmail] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const mainColor = 'rgb(20, 54, 100)';
  const accentColor = 'rgb(175, 214, 241)';
  const bgColor = 'rgb(30, 64, 110)';
  const inputBg = '#FFFFFF';

  const subjects = [
    'History', 'Theatre', 'Modern Languages', 'Mathematics', 'Computer Science', 'English', 'Stone Family Science', 'Religion', 'Visual Art', 'Classics', 'Music', 'Miscellaneous'
  ];

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
    const fetchChairs = async () => {
      try {
        const res = await fetch('/api/get-chairs');
        if (res.ok) setChairs(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchChairs();
  }, []);

  useEffect(() => {
    document.title = "Admin Scheduler";
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await fetch('/api/get-subs');
        if (res.ok) {
          const data = await res.json();
          const processed = data.map(s => ({
            id: s.id,
            email: s.email || 'None',
            firstName: s.first_name || 'None',
            lastName: s.last_name || 'None',
            tags: s.tags || s.departments?.split(',') || ['None'],
            phoneNumber: s.phone_number || 'None',
          }));
          setSubstitutes(processed);
          setFilteredSubs(processed);
        }
      } catch (e) { console.error(e); }
    };
    fetchSubs();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch('/api/get-teachers');
        if (res.ok) {
          const data = await res.json();
          setTeachers(data);
          setFilteredTeachers(data);
        }
      } catch (e) { console.error(e); }
    };
    fetchTeachers();
  }, []);

  const handleBlocksChange = (selectedValues) => {
    if (selectedValues.length <= 5) {
      setBlocks(selectedValues);
    } else {
      toast({
        title: "Limit Reached",
        description: "You can only select up to 5 blocks.",
        status: "warning",
        duration: 2000,
      });
    }
  };

  const handleSubSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSubSearchQuery(q);
    setFilteredSubs(substitutes.filter(
      s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q))
    ));
  };

  const handleTeacherSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setTeacherSearchQuery(q);
    setFilteredTeachers(teachers.filter(
      t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(q)
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // MANUAL VALIDATION (Better than library-enforced)
    if (blocks.length === 0) {
      setFormError('Please select at least one block.');
      return;
    }
    if (!requestDate || !roomNumber || !subject || !selectedTeacherId || !selectedChairEmail) {
      setFormError('All fields including Teacher, Room, and Dept Chair are required.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      teacherId: selectedTeacherId,
      teacherEmail: teachers.find(t => t.id === parseInt(selectedTeacherId))?.email,
      date: requestDate,
      room: roomNumber,
      blocks: blocks.join(', '),
      subject: `Blended, ${subject}`,
      notes,
      selectedSubs,
      adminEmail: selectedChairEmail,
    };

    try {
      const res = await fetch('/api/send-substitute-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      const data = await res.json();
      setEmailPreview(data.emailBody || '');
      toast({ title: 'Success', status: 'success', duration: 5000 });
      setIsFinalized(true);
    } catch (err) {
      setFormError(err.error || 'Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <Container maxW="container.2xl">
        <HStack justify="space-between" align="center" mb={8}>
          <Heading size="xl" color="white">Admin – Schedule (Blended)</Heading>
          <IconButton icon={<ArrowBackIcon />} bg={accentColor} color={mainColor} onClick={() => navigate('/admin-home')} aria-label="back" size="lg" />
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
          <GridItem>
            <Card bg={inputBg} boxShadow="xl" borderRadius="lg" p={4}>
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={5} align="stretch">

                    <FormControl isRequired>
                      <FormLabel color={mainColor} fontWeight="bold">Department Chair</FormLabel>
                      <Select placeholder="Select chair" value={selectedChairEmail} onChange={(e) => setSelectedChairEmail(e.target.value)} color={mainColor}>
                        {chairs.map(c => (
                          <option key={c.id} value={c.email}>{c.first_name} {c.last_name} — ({c.departments})</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color={mainColor} fontWeight="bold">Selected Teacher</FormLabel>
                      <Box p={3} border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50">
                        {selectedTeacherId ? (
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{teachers.find(t => t.id === parseInt(selectedTeacherId))?.first_name} {teachers.find(t => t.id === parseInt(selectedTeacherId))?.last_name}</Text>
                            <Button size="xs" colorScheme="red" variant="ghost" onClick={() => setSelectedTeacherId('')}>Change</Button>
                          </HStack>
                        ) : <Text color="gray.500" fontStyle="italic">Select from the right panel</Text>}
                      </Box>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color={mainColor} fontWeight="bold">Date & Room</FormLabel>
                      <HStack>
                        <Input type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} color={mainColor} />
                        <Input placeholder="Room #" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} color={mainColor} />
                      </HStack>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color={mainColor} fontWeight="bold">Subject</FormLabel>
                      <Wrap spacing={2}>
                        {subjects.map(s => (
                          <Tag key={s} size="lg" variant={subject === s ? 'solid' : 'outline'} colorScheme="blue" cursor="pointer" onClick={() => setSubject(s)}>
                            <TagLabel>{s}</TagLabel>
                          </Tag>
                        ))}
                      </Wrap>
                    </FormControl>

                    {/* FIXED SECTION: isRequired removed from FormControl */}
                    <FormControl isInvalid={blocks.length === 0}>
                      <FormLabel color={mainColor} fontWeight="bold">
                        Block(s) <Badge colorScheme="blue" ml={2}>{blocks.length}/5 Selected</Badge>
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

                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      isDisabled={isFinalized}
                      bgGradient="linear(to-r, blue.400, blue.600)"
                      color="white"
                      leftIcon={<CheckIcon />}
                      size="lg"
                    >
                      Send Blended Request
                    </Button>
                  </VStack>
                </form>
                {emailPreview && <Box mt={8} dangerouslySetInnerHTML={{ __html: emailPreview }} p={4} border="1px solid #eee" borderRadius="md" />}
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Panel stays same */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              <Card bg={inputBg} boxShadow="xl" borderRadius="lg" p={4}>
                <CardHeader pb={2}><Heading size="sm" color={mainColor}>Search Teacher</Heading></CardHeader>
                <CardBody>
                  <InputGroup mb={3}>
                    <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
                    <Input placeholder="Filter by name..." value={teacherSearchQuery} onChange={handleTeacherSearch} />
                  </InputGroup>
                  <List spacing={2} maxH="150px" overflowY="auto">
                    {filteredTeachers.map(t => (
                      <ListItem key={t.id} p={2} borderBottom="1px solid #eee" display="flex" justifyContent="space-between" alignItems="center">
                        <Text fontSize="sm" fontWeight="semibold">{t.first_name} {t.last_name}</Text>
                        <Button size="xs" colorScheme={selectedTeacherId === String(t.id) ? "green" : "blue"} onClick={() => setSelectedTeacherId(String(t.id))}>Select</Button>
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>

              <Card bg={inputBg} boxShadow="xl" borderRadius="lg" p={4}>
                <CardHeader pb={2}><Heading size="sm" color={mainColor}>Select Substitutes</Heading></CardHeader>
                <CardBody>
                  <InputGroup mb={3}>
                    <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
                    <Input placeholder="Search subs..." value={subSearchQuery} onChange={handleSubSearch} />
                  </InputGroup>
                  <List spacing={3} maxH="300px" overflowY="auto">
                    {filteredSubs.map(sub => {
                      const isChosen = selectedSubs.some(s => s.email === sub.email);
                      return (
                        <ListItem key={sub.id} p={2} borderWidth={1} borderRadius="md" borderColor={isChosen ? "blue.400" : "gray.200"} bg={isChosen ? "blue.50" : "white"}>
                          <HStack justify="space-between">
                            <Box><Text fontSize="sm" fontWeight="bold">{sub.firstName} {sub.lastName}</Text><Text fontSize="xs">{sub.tags.join(', ')}</Text></Box>
                            <Button size="xs" colorScheme={isChosen ? "red" : "blue"} onClick={() => isChosen ? setSelectedSubs(selectedSubs.filter(s => s.email !== sub.email)) : setSelectedSubs([...selectedSubs, sub])}>
                              {isChosen ? "Remove" : "Add"}
                            </Button>
                          </HStack>
                        </ListItem>
                      );
                    })}
                  </List>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminScheduler;