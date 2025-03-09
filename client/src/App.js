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
import BookingList from './components/bookings/BookingList';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import TrainingList from './components/trainings/TrainingList';
import CoachDashboard from './components/trainings/CoachDashboard';
import PlayerDashboard from './components/trainings/PlayerDashboard';
import SupervisorDashboard from './components/trainings/SupervisorDashboard';
import ParentDashboard from './components/trainings/ParentDashboard';
import { 
  isAuthenticated, isAdmin, isSupervisor, 
  isCoach, isPlayer, isParent, isCashier 
} from './services/authService';
import Cafeteria from './components/cafeteria/Cafeteria';
import CafeteriaManagement from './components/cafeteria/CafeteriaManagement';
import './App.css';

// Placeholder components for routes
const Tournaments = () => <div>Tournaments Page</div>;
const Payments = () => <div>Payments Page</div>;
const GameList = () => <div>Game List Page</div>;
const GameDetail = () => <div>Game Detail Page</div>;
const GameForm = () => <div>Game Form Page</div>;
const TrainingDetail = () => <div>Training Detail Page</div>;
const TrainingForm = () => <div>Training Form Page</div>;
const TrainingAttendance = () => <div>Training Attendance Page</div>;
const PlayerProgress = () => <div>Player Progress Page</div>;
const TeamProgress = () => <div>Team Progress Page</div>;

// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Redirect cashiers to POS if they try to access any other route
  if (isCashier() && window.location.pathname !== '/cafeteria') {
    return <Navigate to="/cafeteria" />;
  }

  // For role-specific routes, enforce strict role requirements
  if (requiredRole === 'admin' && !isAdmin()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'supervisor' && !(isAdmin() || isSupervisor())) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'cashier' && !isCashier()) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'coach' && !(isAdmin() || isSupervisor() || isCoach())) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'player' && !(isAdmin() || isSupervisor() || isPlayer())) {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'parent' && !(isAdmin() || isSupervisor() || isParent())) {
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
        
        {/* Booking Routes */}
        <Route path="/bookings" element={
          <ProtectedRoute requiredRole="admin">
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
        
        {/* Game & Training Management Routes */}
        <Route path="/trainings" element={
          <ProtectedRoute>
            <MainLayout>
              <TrainingList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/coach" element={
          <ProtectedRoute requiredRole="coach">
            <MainLayout>
              <CoachDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/player" element={
          <ProtectedRoute requiredRole="player">
            <MainLayout>
              <PlayerDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/supervisor" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <SupervisorDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/parent" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <ParentDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/new" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <TrainingForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <TrainingDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/:id/edit" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <TrainingForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/:id/attendance" element={
          <ProtectedRoute requiredRole="coach">
            <MainLayout>
              <TrainingAttendance />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainings/child/:childId" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <TrainingList userView={true} />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/games" element={
          <ProtectedRoute>
            <MainLayout>
              <GameList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/games/new" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <GameForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/games/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <GameDetail />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/games/:id/edit" element={
          <ProtectedRoute requiredRole="supervisor">
            <MainLayout>
              <GameForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/games/player" element={
          <ProtectedRoute requiredRole="player">
            <MainLayout>
              <GameList userView={true} />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/games/child/:childId" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <GameList userView={true} />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/progress" element={
          <ProtectedRoute requiredRole="coach">
            <MainLayout>
              <TeamProgress />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/progress/player" element={
          <ProtectedRoute requiredRole="player">
            <MainLayout>
              <PlayerProgress />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/progress/team/:teamId" element={
          <ProtectedRoute requiredRole="coach">
            <MainLayout>
              <TeamProgress />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/progress/child/:childId" element={
          <ProtectedRoute requiredRole="parent">
            <MainLayout>
              <PlayerProgress />
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
