import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import './App.css';

// Placeholder components for routes
const Dashboard = () => <div>Dashboard Page</div>;
const Players = () => <div>Players Page</div>;
const Teams = () => <div>Teams Page</div>;
const Tournaments = () => <div>Tournaments Page</div>;
const Venues = () => <div>Venues Page</div>;
const Payments = () => <div>Payments Page</div>;

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/payments" element={<Payments />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
