import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import UserList from './components/users/UserList';
import UserForm from './components/users/UserForm';
import NotificationList from './components/notifications/NotificationList';
import { isAuthenticated, isAdmin } from './services/authService';
import './App.css';

// Placeholder components for routes
const Dashboard = () => <div>Dashboard Page</div>;
const Players = () => <div>Players Page</div>;
const Teams = () => <div>Teams Page</div>;
const Tournaments = () => <div>Tournaments Page</div>;
const Venues = () => <div>Venues Page</div>;
const Payments = () => <div>Payments Page</div>;
const Profile = () => <div>User Profile Page</div>;

// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !isAdmin()) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/players" element={
          <ProtectedRoute>
            <MainLayout>
              <Players />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/teams" element={
          <ProtectedRoute>
            <MainLayout>
              <Teams />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/tournaments" element={
          <ProtectedRoute>
            <MainLayout>
              <Tournaments />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/venues" element={
          <ProtectedRoute>
            <MainLayout>
              <Venues />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/payments" element={
          <ProtectedRoute>
            <MainLayout>
              <Payments />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute>
            <MainLayout>
              <NotificationList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/users" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <UserList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/users/new" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <UserForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/users/edit/:id" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <UserForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
