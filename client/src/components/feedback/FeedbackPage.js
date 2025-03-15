import React from 'react';
import { Container } from '@mui/material';
import FeedbackForm from './FeedbackForm';
import FeedbackHistory from './FeedbackHistory';

const FeedbackPage = () => {
  return (
    <Container maxWidth="md">
      <FeedbackForm />
      <FeedbackHistory />
    </Container>
  );
};

export default FeedbackPage; 