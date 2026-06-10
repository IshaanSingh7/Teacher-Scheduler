import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  Card,
  CardBody,
  Spinner,
  useToast,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AdminEditor = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    teacher_id: '',
    blocks_requested: '',
    subject: '',
    room: '',
    day: '',
    subs: '',
    notes: '',
    sent: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();


  useEffect(() => {
    document.title = "Admin Table Editor";
  }, []);

  useEffect(() => {
    if (!requestId) {
      toast({
        title: 'Error',
        description: 'Invalid request ID.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/admin-home');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/edit-request/${requestId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData({
          teacher_id: result.teacher_id || '',
          blocks_requested: result.blocks_requested || '',
          subject: result.subject || '',
          room: result.room || '',
          day: result.day || '',
          subs: result.subs || '',
          notes: result.notes || '',
          sent: result.sent || '',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error fetching data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId, navigate, toast]);

  const handleInputChange = (fieldName, value) => {
    setData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update data');
      toast({
        title: 'Success',
        description: 'Data updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/admin-home');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error updating data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  if (loading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg={bgColor}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8} px={{ base: 4, md: 8 }}>
      <Card bg={cardBg} boxShadow="lg" borderRadius="lg" mb={6}>
        <CardBody>
          <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
            <Heading size="lg" color="gray.800" _dark={{ color: 'gray.100' }}>
              Edit Request
            </Heading>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="outline"
              colorScheme="brand"
              onClick={() => navigate('/admin-home')}
              size="md"
            >
              Home
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Card bg={cardBg} boxShadow="lg" borderRadius="lg" maxW="600px" mx="auto">
        <CardBody>
          <VStack as="form" spacing={4} onSubmit={handleSubmit}>
            <FormControl>
              <FormLabel>Teacher ID</FormLabel>
              <Input
                value={data.teacher_id}
                onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                placeholder="Enter teacher ID"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Blocks Requested</FormLabel>
              <Input
                value={data.blocks_requested}
                onChange={(e) => handleInputChange('blocks_requested', e.target.value)}
                placeholder="Enter blocks (e.g., 1,2,3)"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Subject</FormLabel>
              <Input
                value={data.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter subject"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Room</FormLabel>
              <Input
                value={data.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                placeholder="Enter room number"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Day</FormLabel>
              <Input
                value={data.day}
                onChange={(e) => handleInputChange('day', e.target.value)}
                placeholder="Enter date (YYYY-MM-DD)"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Substitutes</FormLabel>
              <Input
                value={data.subs}
                onChange={(e) => handleInputChange('subs', e.target.value)}
                placeholder="Enter substitute names"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={data.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter notes"
                minRows={3}
                maxRows={10}
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Sent To</FormLabel>
              <Input
                value={data.sent}
                onChange={(e) => handleInputChange('sent', e.target.value)}
                placeholder="Enter email recipients"
                bg="white"
                _dark={{ bg: 'gray.600' }}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              w="full"
              isLoading={isSubmitting}
            >
              Submit
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AdminEditor;