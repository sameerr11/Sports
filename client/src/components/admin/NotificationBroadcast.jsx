import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Select, 
  Checkbox, 
  Alert, 
  AlertIcon, 
  VStack, 
  Heading, 
  useToast
} from '@chakra-ui/react';
import { sendBroadcastNotification } from '../../services/notificationService';

const NotificationBroadcast = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and message fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    try {
      const data = {
        title,
        message,
        sendEmail
      };
      
      // Only include role if it's selected
      if (role) {
        data.role = role;
      }
      
      const response = await sendBroadcastNotification(data);
      setResult(response);
      
      toast({
        title: 'Success',
        description: `Notification sent to ${response.notificationCount} user(s)${response.emailSent ? ' with email' : ''}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setTitle('');
      setMessage('');
      setRole('');
      setSendEmail(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={5} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
      <Heading size="md" mb={4}>Broadcast Notification</Heading>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="title" isRequired>
            <FormLabel>Notification Title</FormLabel>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </FormControl>
          
          <FormControl id="message" isRequired>
            <FormLabel>Notification Message</FormLabel>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={5}
            />
          </FormControl>
          
          <FormControl id="role">
            <FormLabel>Target Role (Optional)</FormLabel>
            <Select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Send to all roles"
            >
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="player">Player</option>
              <option value="parent">Parent</option>
              <option value="supervisor">Supervisor</option>
              <option value="support">Support</option>
              <option value="accounting">Accounting</option>
              <option value="cashier">Cashier</option>
            </Select>
          </FormControl>
          
          <FormControl id="sendEmail">
            <Checkbox 
              isChecked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            >
              Also send as email
            </Checkbox>
          </FormControl>
          
          <Button 
            type="submit" 
            colorScheme="blue" 
            isLoading={loading}
          >
            Send Broadcast
          </Button>
        </VStack>
      </form>
      
      {result && (
        <Alert status="success" mt={4}>
          <AlertIcon />
          Notification sent to {result.notificationCount} user(s)
          {result.emailSent && ` and emailed to ${result.emailRecipients} recipient(s)`}
        </Alert>
      )}
    </Box>
  );
};

export default NotificationBroadcast; 