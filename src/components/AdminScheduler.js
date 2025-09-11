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
    IconButton,
    Tooltip,
    CheckboxGroup
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminScheduler = () => {
    const [date, setDate] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [selfEmail, setSelfEmail] = useState('');
    const [room, setRoom] = useState('');
    const [period, setPeriod] = useState([]);
    const [teacherCaption, setTeacherCaption] = useState('');
    const [emailAllSubs, setEmailAllSubs] = useState(false);
    const [subjectSpecificEmails, setSubjectSpecificEmails] = useState([]);
    const [emailBody, setEmailBody] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [subs, setSubs] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [teacherId, setTeacherId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSubQuery, setSearchSubQuery] = useState('');
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [filteredSubs, setFilteredSubs] = useState([]);

    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Theme colors
    const mainColor = 'rgb(20, 54, 100)';
    const accentColor = 'rgb(175, 214, 241)';
    const bgColor = 'rgb(30, 64, 110)';
    const inputBg = '#FFFFFF';
    const listCardBg = 'gray.100';

    const periods = [
        '1st Period: 8:19am-9:14am',
        '2nd Period: 9:52am-11:02am',
        '3rd Period (flex): 11:06am-12:26pm',
        '3rd Period (no flex): 11:31am-12:26pm',
        '4th Period: 1:02pm-1:47pm',
        '5th Period: 1:51pm-2:46pm',
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
        const filtered = subs.filter((sub) =>
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
    };

    const handleRemoveFromSubjectEmails = (email) => {
        setSubjectSpecificEmails((prev) => prev.filter((sub) => sub.email !== email));
    };

    const handlePeriodChange = (selectedPeriods) => {
        setPeriod(selectedPeriods);
    };

    const handleHome = () => {
        navigate('/admin-home');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const currentDate = new Date();
        if (date && date < currentDate) {
            setError('The selected date must be in the future.');
            return;
        }

        if (!selfEmail) {
            setError('Notification email is required.');
            return;
        }

        if (!teacherId) {
            setError('Teacher ID is required.');
            return;
        }

        if (!date) {
            setError('Date is required.');
            return;
        }

        if (!room) {
            setError('Room number is required.');
            return;
        }

        if (!emailAllSubs && !subjectSpecificEmails.length) {
            setError('Select at least one substitute or check "Email All Substitutes".');
            return;
        }

        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isValidEmail(selfEmail)) {
            setError('Invalid email format.');
            return;
        }

        const data = {
            selfEmail,
            selectedDate: date.toISOString().split('T')[0],
            roomNumber: room,
            selectedPeriod: period.join(', ') || '',
            teacherCaption: teacherCaption || '', // Ensure no undefined
            teacherId,
            emailAllSubs,
            sendingSubs: emailAllSubs ? [] : subjectSpecificEmails, // Array of { email, firstName, lastName }
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
            } else {
                const errorText = await response.text();
                setError(`Server error: ${response.status} - ${errorText || 'Not Found'}`);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setError('Failed to send request. Check server availability.');
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
                                        <Card bg={listCardBg} boxShadow="sm">
                                            <CardBody p={3}>
                                                <Text color={mainColor}>{`${teacher.firstName} ${teacher.lastName}: ${teacher.id}`}</Text>
                                            </CardBody>
                                        </Card>
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
                                <FormControl isRequired isInvalid={!!error}>
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

                                <FormControl isRequired isInvalid={!!error}>
                                    <FormLabel color={mainColor}>Teacher ID</FormLabel>
                                    <Input
                                        value={teacherId}
                                        onChange={(e) => setTeacherId(e.target.value)}
                                        placeholder="Enter teacher ID"
                                        bg={inputBg}
                                        color={mainColor}
                                        borderColor={mainColor}
                                        _placeholder={{ color: mainColor }}
                                    />
                                </FormControl>

                                <HStack w="full" spacing={4}>
                                    <FormControl isRequired isInvalid={!!error}>
                                        <FormLabel color={mainColor}>Date</FormLabel>
                                        <Input
                                            type="date"
                                            value={date ? date.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : null)}
                                            min={new Date().toISOString().split('T')[0]}
                                            placeholder="Select date"
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
                                </HStack>

                                <FormControl isRequired isInvalid={!!error}>
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
                                    <CheckboxGroup value={period} onChange={handlePeriodChange}>
                                        <VStack align="start" spacing={2}>
                                            {periods.map((p, index) => (
                                                <Checkbox key={index} value={p} color={mainColor}>
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
                            <Input
                                value={searchSubQuery}
                                onChange={handleSearchSubs}
                                placeholder="Search by name or tag"
                                mb={4}
                                bg={inputBg}
                                color={mainColor}
                                borderColor={mainColor}
                                _placeholder={{ color: mainColor }}
                            />
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