import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login";
import { NavigationBar } from './components/NavigationBar';
import StaffManagement from './pages/StaffManagement';
import Cars from './pages/Cars';
import Lead from './pages/Lead';
import Jobs from './pages/Jobs';
import Box from '@mui/material/Box';
import ProtectedRoute from './components/ProtectedRoute';
import Homepage from './pages/Homepage';
import AttendanceManagement from './pages/Attendance.jsx';

export default function App() {
  return (
    <Router>
      <Box sx={{ bgcolor: '#F5F5DC', minHeight: '100vh' }}>
        <NavigationBar />
        <Box sx={{ p: 3 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
            <Route path="/staffmanagement" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><AttendanceManagement /></ProtectedRoute>} />
            <Route path="/cars" element={<ProtectedRoute><Cars /></ProtectedRoute>} />
            <Route path="/lead" element={<ProtectedRoute><Lead /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}
