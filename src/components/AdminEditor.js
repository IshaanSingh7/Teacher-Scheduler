// import React, { useEffect, useState } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom'; // Import useNavigate
// import { Table, Input, Button, Form, Spin, message, Card } from 'antd';

// const { TextArea } = Input;

// const AdminEditor = () => {
//     const [searchParams] = useSearchParams();
//     const requestId = searchParams.get('requestId');
//     const [loading, setLoading] = useState(true);
//     const [data, setData] = useState(null);
//     const [teachers, setTeachers] = useState([]);
//     const [form] = Form.useForm();
//     const navigate = useNavigate(); // Initialize useNavigate

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const response = await fetch(`http://localhost:3001/edit-request/${requestId}`, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     }
//                 });
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch data');
//                 }
//                 const result = await response.json();
//                 setData(result);
//                 setLoading(false);
//             } catch (error) {
//                 message.error('Error fetching data');
//                 setLoading(false);
//             }
//         };
//         fetchData();

//     }, [requestId]);

//     const handleInputChange = (fieldName, value) => {
//         setData((prevData) => ({ ...prevData, [fieldName]: value }));
//     };

//     const handleSubmit = async () => {
//         try {
//             const response = await fetch(`http://localhost:3001/requests/${requestId}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(data),
//             });
//             if (!response.ok) {
//                 throw new Error('Failed to update data');
//             }
//             message.success('Data updated successfully');
//         } catch (error) {
//             message.error('Error updating data');
//         }
//     };

//     if (loading) {
//         return <div style={styles.spinnerContainer}><Spin size="large" /></div>;
//     }

//     const columns = [
//         { title: 'Column', dataIndex: 'field', key: 'field' },
//         {
//             title: 'Info', dataIndex: 'value', key: 'value', render: (text, record) => (
//                 record.field === 'notes' ? (
//                     <TextArea
//                         value={data[record.field]}
//                         onChange={(e) => handleInputChange(record.field, e.target.value)}
//                         autoSize={{ minRows: 1, maxRows: 10 }}
//                     />
//                 ) : (
//                     <Input
//                         value={data[record.field]}
//                         onChange={(e) => handleInputChange(record.field, e.target.value)}
//                     />
//                 )
//             ),
//         },
//     ];

//     const dataSource = [
//         { field: 'teacher_id', value: data.teacher_id },
//         { field: 'blocks_requested', value: data.blocks_requested },
//         { field: 'subject', value: data.subject },
//         { field: 'room', value: data.room },
//         { field: 'day', value: data.day },
//         { field: 'subs', value: data.subs },
//         { field: 'notes', value: data.notes },
//         { field: 'sent', value: data.sent },
//     ];


//     return (
//         <div style={styles.pageContainer}>
//             <div style={styles.topBar}>
//                 <div style={styles.title}>Request Editor</div>

//                 <Button
//                     type="primary"
//                     style={styles.homeButton}
//                     onClick={() => navigate('/admin-home')}
//                 >
//                     Home
//                 </Button>
//             </div>
//             <div style={styles.formContainer}>
//                 <Card title="Edit Request" bordered={false} style={styles.card}>
//                     <Form form={form} onFinish={handleSubmit} layout="vertical">
//                         <Table
//                             dataSource={dataSource}
//                             columns={columns}
//                             rowKey="field"
//                             pagination={false}
//                             style={{ marginBottom: '20px' }}
//                         />
//                         <Form.Item>
//                             <Button type="primary" htmlType="submit" block>
//                                 Submit
//                             </Button>
//                         </Form.Item>
//                     </Form>
//                 </Card>
//             </div>
//         </div>
//     );
// };

// const styles = {
//     pageContainer: {
//         display: 'flex',
//         flexDirection: 'column',
//         minHeight: '100vh',
//         backgroundColor: 'rgb(20, 54, 100)',
//     },
//     topBar: {
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: 'white',
//         padding: '10px 20px',
//         zIndex: 1000,
//         display: 'flex',
//         justifyContent: 'flex-end', // Push the Home button to the right
//         alignItems: 'center',
//     }, title: {
//         color: 'black',
//         fontSize: '24px',
//         fontWeight: 'bold',
//         flex: 1
//     },
//     homeButton: {
//         fontSize: '18px',
//         padding: '10px 20px',
//         borderRadius: '5px',

//         color: 'white',
//         border: 'none',
//         transition: 'background-color 0.3s',
//     },
//     card: {
//         width: 600,
//         padding: '20px',
//         borderRadius: '10px',
//         boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//         marginTop: '80px', // to ensure the card is not hidden under the top bar
//     },
//     formContainer: {
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         flex: 1,
//     },
//     spinnerContainer: {
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         minHeight: '100vh',
//     },
// };

// export default AdminEditor;


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
        const response = await fetch(`http://localhost:3001/edit-request/${requestId}`, {
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
      const response = await fetch(`http://localhost:3001/requests/${requestId}`, {
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