import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <BookOpen className="text-primary" />
          <span className="text-gradient">SmartBook</span>
        </Link>
        <div className="navbar-nav">
          <Link to="/" className="nav-link">Browse Books</Link>
          {user ? (
            <>
              <Link to="/add-book" className="nav-link">Add Book</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <span className="text-sm text-muted" style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
                <User size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
