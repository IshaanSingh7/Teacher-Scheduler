import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Input,
  Heading,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  useToast,
  VStack,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AdminAdd = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    departments: '',
    phone_number: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const toast = useToast();

  // Theme colors
  const mainColor = 'rgb(20, 54, 100)'; // Navy blue
  const accentColor = 'rgb(175, 214, 241)'; // Light blue
  const bgColor = 'rgb(30, 64, 110)'; // Lighter navy blue
  const textColor = '#FFFFFF'; // White for contrast
  const inputBg = '#FFFFFF'; // White for inputs and table

  useEffect(() => {
    if (!user || !isAuthenticated) {
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
        const response = await fetch('/api/get-users');
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setUsers(result);
        setFilteredUsers(result);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch users.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isAuthenticated, navigate, toast]);

  const handleNewUserChange = (field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUserSubmit = async () => {
    setError('');

    const requiredFields = ['first_name', 'last_name', 'email', 'role'];
    const missingFields = requiredFields.filter((field) => !newUser[field]);
    if (missingFields.length > 0) {
      setError('Please fill in all required fields: First Name, Last Name, Email, Role.');
      return;
    }

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail(newUser.email)) {
      setError('Invalid email format.');
      return;
    }

    try {
      const url = isEditing ? `/api/update-user/${selectedUserId}` : '/api/add-user';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'add'} user`);
      }

      if (isEditing) {
        setUsers((prev) =>
          prev.map((user) => (user.id === selectedUserId ? { ...user, ...newUser } : user))
        );
        setFilteredUsers((prev) =>
          prev.map((user) => (user.id === selectedUserId ? { ...user, ...newUser } : user))
        );
      } else {
        setUsers((prev) => [...prev, result]);
        setFilteredUsers((prev) => [...prev, result]);
      }

      setShowNewUserForm(false);
      setIsEditing(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        departments: '',
        phone_number: '',
      });
      setSelectedUserId(null);
      toast({
        title: 'Success',
        description: `User ${isEditing ? 'updated' : 'added'} successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} user:`, error);
      setError(error.message);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = users.filter(
      (user) =>
        (user.email && user.email.toLowerCase().includes(value)) ||
        (user.first_name && user.first_name.toLowerCase().includes(value)) ||
        (user.last_name && user.last_name.toLowerCase().includes(value))
    );

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/delete-user/${selectedUserId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((user) => user.id !== selectedUserId));
      setFilteredUsers((prev) => prev.filter((user) => user.id !== selectedUserId));
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setSelectedUserId(null);
    }
  };

  const openActionModal = (userId) => {
    setSelectedUserId(userId);
    onActionOpen();
  };

  const handleEditUser = () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setNewUser({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || '',
        departments: user.departments || '',
        phone_number: user.phone_number || '',
      });
      setIsEditing(true);
      setShowNewUserForm(true);
    }
    onActionClose();
  };

  const handleDeleteConfirm = () => {
    onActionClose();
    onDeleteOpen();
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
            <Heading size="lg" color={textColor}>
              User Management
            </Heading>
            <HStack spacing={3}>
              <Button
                bg={accentColor}
                color={mainColor}
                _hover={{ bg: inputBg, color: mainColor }}
                onClick={() => navigate('/admin-home')}
                size="md"
                leftIcon={<ArrowBackIcon />}
              >
                Back to Home
              </Button>
              <Button
                bg={accentColor}
                color={mainColor}
                _hover={{ bg: inputBg, color: mainColor }}
                onClick={() => {
                  setShowNewUserForm(!showNewUserForm);
                  if (showNewUserForm) {
                    setIsEditing(false);
                    setNewUser({
                      first_name: '',
                      last_name: '',
                      email: '',
                      role: '',
                      departments: '',
                      phone_number: '',
                    });
                  }
                }}
                size="md"
              >
                {showNewUserForm ? 'Cancel' : 'Add New User'}
              </Button>
            </HStack>
          </HStack>
        </CardBody>
      </Card>
      <Grid templateColumns={{ base: '1fr', md: showNewUserForm ? '1fr 2fr' : '1fr' }} gap={6}>
        <GridItem>
          <Card bg={inputBg} boxShadow="lg" borderRadius="lg">
            <CardBody>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearch}
                mb={4}
                bg={inputBg}
                color={mainColor}
                borderColor={mainColor}
                _placeholder={{ color: mainColor }}
              />
              <Table variant="simple" bg={inputBg} borderRadius="md">
                <Thead bg={inputBg}>
                  <Tr>
                    <Th color={mainColor}>ID</Th>
                    <Th color={mainColor}>Email</Th>
                    <Th color={mainColor}>First Name</Th>
                    <Th color={mainColor}>Last Name</Th>
                    <Th color={mainColor}>Role</Th>
                    <Th color={mainColor}>Departments</Th>
                    <Th color={mainColor}>Phone Number</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((user) => (
                    <Tr key={user.id} _hover={{ bg: accentColor, color: mainColor }}>
                      <Td>
                        <Button
                          variant="link"
                          color={mainColor}
                          _hover={{ color: mainColor }}
                          onClick={() => openActionModal(user.id)}
                        >
                          {user.id}
                        </Button>
                      </Td>
                      <Td color={mainColor}>{user.email}</Td>
                      <Td color={mainColor}>{user.first_name}</Td>
                      <Td color={mainColor}>{user.last_name}</Td>
                      <Td color={mainColor}>{user.role}</Td>
                      <Td color={mainColor}>{user.departments}</Td>
                      <Td color={mainColor}>{user.phone_number}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>

        {showNewUserForm && (
          <GridItem>
            <Card bg={inputBg} boxShadow="lg" borderRadius="lg" maxW="lg" w="full" borderColor={mainColor} borderWidth={1}>
              <CardBody>
                <Heading size="md" mb={4} color={mainColor}>
                  {isEditing ? 'Edit User' : 'Add New User'}
                </Heading>
                <VStack spacing={4} as="form" onSubmit={(e) => { e.preventDefault(); handleAddUserSubmit(); }}>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel color={mainColor}>First Name</FormLabel>
                    <Input
                      value={newUser.first_name}
                      onChange={(e) => handleNewUserChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel color={mainColor}>Last Name</FormLabel>
                    <Input
                      value={newUser.last_name}
                      onChange={(e) => handleNewUserChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel color={mainColor}>Email</FormLabel>
                    <Input
                      value={newUser.email}
                      onChange={(e) => handleNewUserChange('email', e.target.value)}
                      placeholder="Enter email"
                      type="email"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel color={mainColor}>Role</FormLabel>
                    <Input
                      value={newUser.role}
                      onChange={(e) => handleNewUserChange('role', e.target.value)}
                      placeholder="Enter role"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color={mainColor}>Departments</FormLabel>
                    <Input
                      value={newUser.departments}
                      onChange={(e) => handleNewUserChange('departments', e.target.value)}
                      placeholder="Enter departments"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color={mainColor}>Phone Number</FormLabel>
                    <Input
                      value={newUser.phone_number}
                      onChange={(e) => handleNewUserChange('phone_number', e.target.value)}
                      placeholder="Enter phone number"
                      type="tel"
                      bg={inputBg}
                      color={mainColor}
                      borderColor={mainColor}
                      _placeholder={{ color: mainColor }}
                    />
                  </FormControl>
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
                    w="full"
                  >
                    {isEditing ? 'Update' : 'Submit'}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        )}
      </Grid>

      <Modal isOpen={isActionOpen} onClose={onActionClose}>
        <ModalOverlay />
        <ModalContent boxShadow="lg">
          <ModalHeader bg={mainColor} color={textColor}>Manage User</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody bg={inputBg} color={mainColor}>
            Select an action for this user.
          </ModalBody>
          <ModalFooter bg={inputBg}>
            <Button
              bg={accentColor}
              color={mainColor}
              _hover={{ bg: inputBg, color: mainColor }}
              onClick={onActionClose}
              mr={3}
            >
              Cancel
            </Button>
            <Button
              bg={accentColor}
              color={mainColor}
              _hover={{ bg: inputBg, color: mainColor }}
              onClick={handleEditUser}
              mr={3}
            >
              Edit
            </Button>
            <Button
              bg="red.500"
              color={textColor}
              _hover={{ bg: 'red.600' }}
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent boxShadow="lg">
          <ModalHeader bg={mainColor} color={textColor}>Confirm Deletion</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody bg={inputBg} color={mainColor}>
            Are you sure you want to delete this user? This action cannot be undone.
          </ModalBody>
          <ModalFooter bg={inputBg}>
            <Button
              bg={accentColor}
              color={mainColor}
              _hover={{ bg: inputBg, color: mainColor }}
              onClick={onDeleteClose}
              mr={3}
            >
              Cancel
            </Button>
            <Button
              bg="red.500"
              color={textColor}
              _hover={{ bg: 'red.600' }}
              onClick={handleDeleteUser}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminAdd;