import { Box, Card, CardBody, Heading, Text, useColorModeValue } from '@chakra-ui/react';

const Welcome = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Box minH="100vh" bg={bgColor} py={{ base: 8, md: 12 }} px={{ base: 4, md: 8 }} display="flex" alignItems="center" justifyContent="center">
      <Card bg={cardBg} boxShadow="lg" borderRadius="lg" maxW="sm" w="full">
        <CardBody textAlign="center">
          <Heading size="lg" mb={4} color="gray.800" _dark={{ color: 'gray.100' }}>
            Welcome!
          </Heading>
          <Text fontSize="md" color="gray.600" _dark={{ color: 'gray.300' }}>
            You have successfully logged in. Now you can access the scheduler.
          </Text>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Welcome;