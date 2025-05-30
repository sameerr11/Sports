import React, { useEffect, useState } from 'react';
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
  isSupport, hasRole, isSportsSupervisor, isBookingSupervisor, isRevenueManager
} from './services/authService';
import Cafeteria from './components/cafeteria/Cafeteria';
import CafeteriaManagement from './components/cafeteria/CafeteriaManagement';
import CafeDashboard from './components/cafeteria/CafeDashboard';
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
import SupportAttendanceReport from './components/support/SupportAttendanceReport';
// Import registration components
import RegistrationList from './components/registration/RegistrationList';
import RegistrationForm from './components/registration/RegistrationForm';
import RegistrationDetail from './components/registration/RegistrationDetail';
import RegistrationFeeManager from './components/registration/RegistrationFeeManager';
import SalaryInvoice from './components/registration/SalaryInvoice';
import SalaryInvoiceList from './components/registration/SalaryInvoiceList';
import './App.css';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';
// Import utility components
import UtilityBillList from './components/utilities/UtilityBillList';
import UtilityBillForm from './components/utilities/UtilityBillForm';
import UserSalaryConfig from './components/admin/UserSalaryConfig';
// Import the RegistrationFeeConfig component
import RegistrationFeeConfig from './components/admin/RegistrationFeeConfig';
import SingleSessionFeeConfig from './components/admin/SingleSessionFeeConfig';
// Import the RevenueDashboard component
import RevenueDashboard from './components/revenue/RevenueDashboard';
import GuestBookingPage from './components/guestBooking/GuestBookingPage';
import SendNotification from './components/admin/SendNotification';
import SingleSessionPaymentForm from './components/revenue/SingleSessionPaymentForm';
import PlayerStatsPage from './components/admin/PlayerStatsPage';
import PlayersWithParentsPage from './components/admin/PlayersWithParentsPage';
import SendNotificationForm from './components/admin/SendNotificationForm';

// Placeholder components for routes
const Tournaments = () => <div>Tournaments Page</div>;
const Payments = () => <div>Payments Page</div>;

// Detect if we're on booking subdomain - improved with error handling
const isBookingSubdomain = () => {
  try {
    const hostname = window.location.hostname || '';
    const isBooking = hostname.startsWith('booking.');
    console.log('Hostname:', hostname, 'Is booking subdomain:', isBooking);
    return isBooking;
  } catch (err) {
    console.error('Error detecting subdomain:', err);
    return false;
  }
};

// Create a standalone App component that doesn't use AuthContext
function StandaloneBookingApp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Add a class to the body element for styling
      document.body.classList.add('booking-subdomain');
      
      // Small delay to ensure components are ready
      setTimeout(() => {
        setLoading(false);
      }, 200);
    } catch (err) {
      console.error('Error in subdomain setup:', err);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // For the booking subdomain, use a simplified router with only the guest booking page
  return (
    <Router>
      <Routes>
        {/* All paths should lead to the GuestBookingPage on the booking subdomain */}
        <Route path="*" element={<GuestBookingPage />} />
      </Routes>
    </Router>
  );
}

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

  // Prevent sports supervisors from accessing courts routes
  if (isSportsSupervisor() && (
    window.location.pathname.startsWith('/courts/new') || 
    window.location.pathname.startsWith('/courts/edit')
  )) {
    return <Navigate to="/" />;
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
  
  // Redirect revenue managers to revenue dashboard if they try to access the main dashboard
  if (isRevenueManager() && !isAdmin() && window.location.pathname === '/' && !requiredRole) {
    return <Navigate to="/revenue/dashboard" />;
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
  
  // If user is already authenticated, redirect to appropriate page based on role
  if (user) {
    // Redirect booking supervisors directly to bookings page
    if (user.role === 'supervisor' && user.supervisorType === 'booking') {
      return <Navigate to="/bookings" />;
    }
    // Redirect revenue managers directly to revenue dashboard
    if (user.role === 'revenue_manager') {
      return <Navigate to="/revenue/dashboard" />;
    }
    // Default redirect for other users
    return <Navigate to="/" />;
  }
  
  // Otherwise, render the login page
  return children;
};

// Main App component with regular routing for the main domain
function AppContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure components are ready
    setTimeout(() => {
      setLoading(false);
    }, 200);
  }, []);

  // Display loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Regular app with full routing for main domain
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
          <EnhancedProtectedRoute requiredRole={["admin", "accounting"]}>
            <MainLayout>
              <SalaryInvoiceList />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/registrations/salary" element={
          <EnhancedProtectedRoute requiredRole={["admin", "accounting"]}>
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
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
            <MainLayout>
              {!isSportsSupervisor() ? <CourtForm /> : <Navigate to="/" />}
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/courts/edit/:id" element={
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
            <MainLayout>
              {!isSportsSupervisor() ? <CourtForm /> : <Navigate to="/" />}
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
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
            <MainLayout>
              <TeamForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/teams/edit/:id" element={
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
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
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <UserForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Added a route to specifically view players */}
        <Route path="/users/role/:role" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <UserList />
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
        
        <Route path="/admin/user-salary-config" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <UserSalaryConfig />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/registration-fees" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <RegistrationFeeConfig />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/single-session-fees" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <SingleSessionFeeConfig />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/send-notification" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <SendNotification />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/broadcast" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <SendNotification />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/player-stats" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <PlayerStatsPage />
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
        
        <Route path="/support/attendance-report" element={
          <ProtectedRoute requiredRole={["admin", "support"]}>
            <MainLayout>
              <SupportAttendanceReport />
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
        
        <Route path="/cafeteria/dashboard" element={
          <ProtectedRoute requiredRole={["admin", "supervisor"]}>
            <MainLayout>
              <CafeDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Utility Routes */}
        <Route path="/utilities" element={
          <EnhancedProtectedRoute requiredRole={["admin", "accounting"]}>
            <MainLayout>
              <UtilityBillList />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        <Route path="/utilities/new" element={
          <EnhancedProtectedRoute requiredRole={["admin", "accounting"]}>
            <MainLayout>
              <UtilityBillForm />
            </MainLayout>
          </EnhancedProtectedRoute>
        } />
        
        {/* Revenue Manager Routes */}
        <Route path="/revenue/dashboard" element={
          <ProtectedRoute requiredRole={['revenue_manager', 'admin']}>
            <MainLayout>
              <RevenueDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/revenue/single-session" element={
          <ProtectedRoute requiredRole={['revenue_manager', 'admin', 'accounting']}>
            <MainLayout>
              <SingleSessionPaymentForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Guest Booking Route - keep this for direct access on main domain */}
        <Route path="/guest-booking" element={<GuestBookingPage />} />
        
        {/* Players with Parents Route */}
        <Route path="/players-with-parents" element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <PlayersWithParentsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// Main App wrapper with conditional AuthProvider
function App() {
  // Early detection of booking subdomain before any auth context loads
  if (isBookingSubdomain()) {
    console.log('Rendering StandaloneBookingApp for booking subdomain');
    return <StandaloneBookingApp />;
  }

  // Only wrap with AuthProvider for the main domain
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;