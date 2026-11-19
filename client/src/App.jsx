import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import api from './api';
import { Home, Services, Gallery, Contact, Login, Register, Booking, Dashboard, Admin } from './pages.jsx';
const Ctx = createContext(); export const useAuth = () => useContext(Ctx);
const Guard = ({ children, admin }) => { const { user, ready } = useAuth();
  if (!ready) return null; if (!user) return <Navigate to="/login" />; if (admin && user.role !== 'admin') return <Navigate to="/" />; return children; };
export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), nav = useNavigate();
  useEffect(() => { localStorage.getItem('token') ? api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true)) : setReady(true); }, []);
  const login = d => { localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); nav('/'); };
  return <Ctx.Provider value={{ user, ready, login, logout, setUser }}>
    <nav><b>📸 PhotoStudio</b><Link to="/">Home</Link><Link to="/services">Services</Link><Link to="/gallery">Gallery</Link><Link to="/booking">Booking</Link><Link to="/contact">Contact</Link>
      {user ? <>{user.role === 'admin' ? <Link to="/admin">Admin</Link> : <Link to="/dashboard">My Dashboard</Link>}<button onClick={logout}>Logout</button></> : <Link className="btn gold" to="/login">Login</Link>}</nav>
    <main><Routes><Route path="/" element={<Home />} /><Route path="/services" element={<Services />} /><Route path="/gallery" element={<Gallery />} /><Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
      <Route path="/booking" element={<Guard><Booking /></Guard>} /><Route path="/dashboard" element={<Guard><Dashboard /></Guard>} /><Route path="/admin" element={<Guard admin><Admin /></Guard>} /></Routes></main></Ctx.Provider>;
}
