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
  isCoach, isPlayer, isParent, isCashier, isPlayerOnly, isAdminOrSupport, isCafeteriaSupervisor, isAccounting,
  isSupport, hasRole
} from './services/authService';
import Cafeteria from './components/cafeteria/Cafeteria';
import CafeteriaManagement from './components/cafeteria/CafeteriaManagement';
import CoachDashboard from './components/coach/CoachDashboard';
import TrainingPlanManager from './components/training/TrainingPlanManager';
import TrainingPlanDetail from './components/training/TrainingPlanDetail';
import PlayerDashboard from './components/player/PlayerDashboard';
import ParentDashboard from './components/parent/ParentDashboard';
import MatchDetail from './components/parent/MatchDetail';
import FeedbackPage from './components/feedback/FeedbackPage';
import AdminFeedbackList from './components/feedback/AdminFeedbackList';
import DocumentManagement from './components/support/DocumentManagement';
import SupportDashboard from './components/support/SupportDashboard';
import PlayerStats from './components/support/PlayerStats';
// Import registration components
import RegistrationList from './components/registration/RegistrationList';
import RegistrationForm from './components/registration/RegistrationForm';
import RegistrationDetail from './components/registration/RegistrationDetail';
import RegistrationFeeManager from './components/registration/RegistrationFeeManager';
import SalaryInvoice from './components/registration/SalaryInvoice';
import SalaryInvoiceList from './components/registration/SalaryInvoiceList';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';
// Import utility components
import UtilityBillList from './components/utilities/UtilityBillList';
import UtilityBillForm from './components/utilities/UtilityBillForm';

// Placeholder components for routes
const Tournaments = () => <div>Tournaments Page</div>;
const Payments = () => <div>Payments Page</div>;

// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Check for required role if specified
  // This function uses the local storage user object
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => hasRole(role))
      : hasRole(requiredRole);

    if (!hasRequiredRole) {
      // Redirect to main page if user doesn't have required role
      return <Navigate to="/" />;
    }
  }

  // Redirect cashiers to POS if they try to access any other route
  if (isCashier() && window.location.pathname !== '/cafeteria') {
    return <Navigate to="/cafeteria" />;
  }
  
  // Redirect cafeteria supervisors to cafeteria management if they try to access the main dashboard
  if (isCafeteriaSupervisor() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/cafeteria/manage" />;
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
  
  // Redirect support users to support dashboard if they try to access the main dashboard
  if (isSupport() && !isAdmin() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/support/dashboard" />;
  }
  
  // Redirect accounting users to registrations if they try to access the main dashboard
  // Only redirect if NOT an admin user
  if (isAccounting() && !isAdmin() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/registrations" />;
  }

  // If everything is ok, render the child component
  return children;
};

// Enhanced Protected Route that uses the AuthContext directly
const EnhancedProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, initialized } = useAuth();
  
  // Show loading indicator while auth state is initializing
  if (loading || !initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Check for required role if specified
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => user.role === role)
      : user.role === requiredRole;
      
    if (!hasRequiredRole) {
      // Redirect to main page if user doesn't have required role
      return <Navigate to="/" />;
    }
  }
  
  // If everything is ok, render the child component
  return children;
};

// Public Route - redirects to home if already authenticated
const PublicRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  
  // Show loading indicator while auth state is initializing
  if (loading || !initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If user is already authenticated, redirect to home
  if (user) {
    return <Navigate to="/" />;
  }
  
  // Otherwise, render the login page
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Registration Routes */}
        <Route path="/registrations" element={
          <EnhancedProtectedRoute>
            <MainLayout>
              <RegistrationList />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/registrations/new" element={
          <EnhancedProtectedRoute requiredRole="accounting">
            <MainLayout>
              <RegistrationForm />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/registrations/:id" element={
          <EnhancedProtectedRoute>
            <MainLayout>
              <RegistrationDetail />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/registration-fees" element={
          <EnhancedProtectedRoute>
            <MainLayout>
              <RegistrationFeeManager />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/registrations/salary/list" element={
          <EnhancedProtectedRoute requiredRole="accounting">
            <MainLayout>
              <SalaryInvoiceList />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/registrations/salary" element={
          <EnhancedProtectedRoute requiredRole="accounting">
            <MainLayout>
              <SalaryInvoice />
            </MainLayout>
          </EnhancedProtectedRoute>
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
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
            <MainLayout>
              <TeamScheduler />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/training-plans" element={
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
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
        
        <Route path="/parent/feedback" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <FeedbackPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/parent/match/:id" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <MatchDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Booking Routes */}
        <Route path="/bookings" element={
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
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
        
        <Route path="/admin/feedback" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <AdminFeedbackList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/support/dashboard" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <SupportDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/support/feedback" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <AdminFeedbackList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/support/documents" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <DocumentManagement />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/player-stats" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <PlayerStats />
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
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
            <MainLayout>
              <CafeteriaManagement />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Utility Routes */}
        <Route path="/utilities" element={
          <EnhancedProtectedRoute requiredRole="accounting">
            <MainLayout>
              <UtilityBillList />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/utilities/new" element={
          <EnhancedProtectedRoute requiredRole="accounting">
            <MainLayout>
              <UtilityBillForm />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
