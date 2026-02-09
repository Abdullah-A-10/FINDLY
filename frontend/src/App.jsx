import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import Listings from './pages/Listings';
import './App.css';
import Matches from './pages/Matches';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';
import MyClaims from './pages/MyClaims';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/listings" 
              element={
                <ProtectedRoute>
                  < Listings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claims" 
              element={
                <ProtectedRoute>
                  <MyClaims/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lost/report" 
              element={
                <ProtectedRoute>
                  <ReportLost/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/found/report" 
              element={
                <ProtectedRoute>
                  <ReportFound />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mylistings" 
              element={
                <ProtectedRoute>
                  <MyListings/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/matches" 
               element={
                <ProtectedRoute>
                  <Matches/>
                </ProtectedRoute>
              } 
            
            />
            <Route 
              path="/notifications" 
               element={
                <ProtectedRoute>
                  <Notifications/>
                </ProtectedRoute>
              } 
            
            />
            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;