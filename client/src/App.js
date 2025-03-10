import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import UserList from './components/users/UserList';
import UserForm from './components/users/UserForm';
import NotificationList from './components/notifications/NotificationList';
import CourtList from './components/courts/CourtList';
import CourtForm from './components/courts/CourtForm';
import CourtDetail from './components/courts/CourtDetail';
import TeamList from './components/teams/TeamList';
import TeamForm from './components/teams/TeamForm';
import TeamDetail from './components/teams/TeamDetail';
import TeamScheduler from './components/teams/TeamScheduler';
import BookingList from './components/bookings/BookingList';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import { 
  isAuthenticated, isAdmin, isSupervisor, 
  isCoach, isPlayer, isParent, isCashier, isPlayerOnly 
} from './services/authService';
import Cafeteria from './components/cafeteria/Cafeteria';
import CafeteriaManagement from './components/cafeteria/CafeteriaManagement';
import CoachDashboard from './components/coach/CoachDashboard';
import TrainingPlanManager from './components/training/TrainingPlanManager';
import TrainingPlanDetail from './components/training/TrainingPlanDetail';
import PlayerDashboard from './components/player/PlayerDashboard';
import ParentDashboard from './components/parent/ParentDashboard';
import './App.css';

// Placeholder components for routes
const Tournaments = () => <div>Tournaments Page</div>;
const Payments = () => <div>Payments Page</div>;

// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Redirect cashiers to POS if they try to access any other route
  if (isCashier() && window.location.pathname !== '/cafeteria') {
    return <Navigate to="/cafeteria" />;
  }
  
  // Redirect parents to parent dashboard if they try to access the main dashboard
  if (isParent() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/parent" />;
  }
  
  // Redirect players to player dashboard if they try to access the main dashboard
  if (isPlayerOnly() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/player" />;
  }
  
  // Redirect coaches to coach dashboard if they try to access the main dashboard
  if (isCoach() && !isSupervisor() && !isAdmin() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/coach" />;
  }

  if (requiredRole === 'admin' && !isAdmin()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'supervisor' && !isSupervisor()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'cashier' && !isCashier()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'coach' && !isCoach()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'player' && !isPlayerOnly()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'parent' && !isParent()) {
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
        
        {/* Court Routes */}
        <Route path="/courts" element={
          <ProtectedRoute>
            <MainLayout>
              <CourtList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/courts/new" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <CourtForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/courts/edit/:id" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <CourtForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/courts/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <CourtDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Team Routes */}
        <Route path="/teams" element={
          <ProtectedRoute>
            <MainLayout>
              <TeamList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/teams/new" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <TeamForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/teams/edit/:id" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <TeamForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/teams/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <TeamDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/teams/schedule" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <TeamScheduler />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/training-plans" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <TrainingPlanManager />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/training-plans/:id" element={
          <ProtectedRoute requiredRole="coach">
            <MainLayout>
              <TrainingPlanDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Coach Routes */}
        <Route path="/coach" element={
          <ProtectedRoute requiredRole="coach">
            <MainLayout>
              <CoachDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Player Routes */}
        <Route path="/player" element={
          <ProtectedRoute requiredRole="player">
            <MainLayout>
              <PlayerDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Parent Routes */}
        <Route path="/parent" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <ParentDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Booking Routes */}
        <Route path="/bookings" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <BookingList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/bookings/me" element={
          <ProtectedRoute>
            <MainLayout>
              <BookingList userOnly={true} />
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
        
        {/* Cafeteria Routes */}
        <Route path="/cafeteria" element={
          <ProtectedRoute requiredRole="cashier">
            <MainLayout>
              <Cafeteria />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/cafeteria/manage" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <CafeteriaManagement />
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
