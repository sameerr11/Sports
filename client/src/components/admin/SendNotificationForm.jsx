import React, { useState } from 'react';
import axios from 'axios';
import { sendBroadcastNotification } from '../../services/notificationService';

const SendNotificationForm = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('All Users');
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setSending(true);
    setError(null);
    setSuccess(null);
    
    try {
      const role = recipientType !== 'All Users' ? recipientType.toLowerCase() : undefined;
      
      const response = await sendBroadcastNotification({
        title,
        message,
        role,
        sendEmail
      });
      
      setSuccess(`Notification sent successfully to ${response.notificationCount} users${
        response.emailSent ? ` and emailed to ${response.emailRecipients} recipients` : ''
      }.`);
      
      // Reset form
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.toString());
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="send-notification-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Send Notification</h2>
      
      {error && (
        <div style={{ backgroundColor: '#ffdddd', color: '#990000', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ backgroundColor: '#ddffdd', color: '#006600', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="notification-title" style={{ display: 'block', marginBottom: '5px' }}>
            Notification Title *
          </label>
          <input
            id="notification-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="message" style={{ display: 'block', marginBottom: '5px' }}>
            Message *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="recipient-type" style={{ display: 'block', marginBottom: '5px' }}>
            Recipient Type
          </label>
          <select
            id="recipient-type"
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="All Users">All Users</option>
            <option value="admin">Admin</option>
            <option value="coach">Coach</option>
            <option value="player">Player</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Also send as email
          </label>
        </div>
        
        <button
          type="submit"
          disabled={sending}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: sending ? 'not-allowed' : 'pointer',
            width: '100%',
            textTransform: 'uppercase'
          }}
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
};

export default SendNotificationForm; 