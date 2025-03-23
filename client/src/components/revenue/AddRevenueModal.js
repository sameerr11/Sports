import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { addRevenueTransaction } from '../../services/revenueService';

const AddRevenueModal = ({ show, onHide, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    sourceType: 'Registration',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    if (!formData.amount || !formData.sourceType || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Convert amount to number
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      await addRevenueTransaction(submitData);
      
      // Reset form and close modal
      setFormData({
        amount: '',
        sourceType: 'Registration',
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Revenue Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Amount ($) <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Source Type <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="sourceType"
              value={formData.sourceType}
              onChange={handleChange}
              required
            >
              <option value="Registration">Registration</option>
              <option value="Cafeteria">Cafeteria</option>
              <option value="Rental">Rental</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Date <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Saving...
            </>
          ) : 'Save Transaction'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddRevenueModal; 