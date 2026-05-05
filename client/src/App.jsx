import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Listings from './pages/Listings';
import CarDetail from './pages/CarDetail';
import PostListing from './pages/PostListing';
import Login from './pages/Login';
import Register from './pages/Register';
import MyListings from './pages/MyListings';
import MyBookings from './pages/MyBookings';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Nouvelles pages ajoutées
import About from './pages/About';
import Contact from './pages/Contact';
import VerifyIdentity from './pages/VerifyIdentity';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Auth Context
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [favIds, setFavIds] = useState(new Set());

  useEffect(() => {
    const storedToken = localStorage.getItem('rentcar_token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      axios.get('/api/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('rentcar_token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { setNotifCount(0); setMsgCount(0); setFavIds(new Set()); return; }
    axios.get('/api/favorites/ids').then(res => setFavIds(new Set(res.data.ids))).catch(() => {});
    const fetchNotifs = () => {
      axios.get('/api/bookings/notifications').then(res => setNotifCount(res.data.total || 0)).catch(() => {});
      axios.get('/api/messages/unread-count').then(res => setMsgCount(res.data.count || 0)).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const login = (newToken, userData) => {
    localStorage.setItem('rentcar_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
  };

  const toggleFavorite = async (carId) => {
    const isFav = favIds.has(carId);
    setFavIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(carId) : next.add(carId);
      return next;
    });
    try {
      if (isFav) await axios.delete(`/api/favorites/${carId}`);
      else await axios.post(`/api/favorites/${carId}`);
    } catch {
      setFavIds(prev => {
        const next = new Set(prev);
        isFav ? next.add(carId) : next.delete(carId);
        return next;
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('rentcar_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setNotifCount(0);
    setMsgCount(0);
    setFavIds(new Set());
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, notifCount, setNotifCount, msgCount, setMsgCount, favIds, toggleFavorite }}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* Règle le problème du scroll */}
        <ScrollToTop />
        
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Routes Pages d'information */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Routes Protégées */}
            <Route path="/post-listing" element={<ProtectedRoute><PostListing /></ProtectedRoute>} />
            <Route path="/edit-listing/:id" element={<ProtectedRoute><PostListing /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/verify-identity" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </AuthContext.Provider>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="text-8xl">🚗</div>
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500 text-lg">Page not found</p>
      <a href="/" className="btn-primary mt-4">Go to Home</a>
    </div>
  );
}

export default App;