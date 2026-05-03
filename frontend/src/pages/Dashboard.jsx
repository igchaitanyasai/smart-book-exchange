import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { session } = useAuth();
  const token = session?.access_token;
  
  const [activeTab, setActiveTab] = useState('my-books');
  const [myBooks, setMyBooks] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [booksRes, reqRes, incRes] = await Promise.all([
        fetch(`${API_URL}/api/books/my-books`, { headers }),
        fetch(`${API_URL}/api/requests/my-requests`, { headers }),
        fetch(`${API_URL}/api/requests/incoming`, { headers })
      ]);

      const [books, reqs, incReqs] = await Promise.all([
        booksRes.json(), reqRes.json(), incRes.json()
      ]);

      setMyBooks(books || []);
      setMyRequests(reqs || []);
      setIncomingRequests(incReqs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`${API_URL}/api/books/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMyBooks(myBooks.filter(b => b.id !== id));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSold = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/books/${id}/sold`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMyBooks(myBooks.map(b => b.id === id ? { ...b, is_sold: true } : b));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container mt-8">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mt-8 animate-fade-in">
      <h2>Your Dashboard</h2>
      
      <div className="flex gap-4 mt-8 mb-8" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          className={`nav-link ${activeTab === 'my-books' ? 'text-primary' : ''}`}
          style={{ paddingBottom: '1rem', borderBottom: activeTab === 'my-books' ? '2px solid var(--primary)' : 'none', background: 'transparent' }}
          onClick={() => setActiveTab('my-books')}
        >
          My Books
        </button>
        <button 
          className={`nav-link ${activeTab === 'my-requests' ? 'text-primary' : ''}`}
          style={{ paddingBottom: '1rem', borderBottom: activeTab === 'my-requests' ? '2px solid var(--primary)' : 'none', background: 'transparent' }}
          onClick={() => setActiveTab('my-requests')}
        >
          My Requests
        </button>
        <button 
          className={`nav-link ${activeTab === 'incoming-requests' ? 'text-primary' : ''}`}
          style={{ paddingBottom: '1rem', borderBottom: activeTab === 'incoming-requests' ? '2px solid var(--primary)' : 'none', background: 'transparent' }}
          onClick={() => setActiveTab('incoming-requests')}
        >
          Incoming Requests
        </button>
      </div>

      {activeTab === 'my-books' && (
        <div>
          {myBooks.length === 0 ? (
            <p className="text-muted">You haven't listed any books yet.</p>
          ) : (
            <div className="books-grid">
              {myBooks.map(book => (
                <div key={book.id} className="glass-card">
                  <div className="flex justify-between items-start">
                    <h3 className="text-gradient mb-2">{book.title}</h3>
                    {book.is_sold && <span className="badge badge-sold">Sold</span>}
                  </div>
                  <p className="text-muted text-sm mb-4">By {book.author}</p>
                  <p className="font-bold mb-4">${book.price}</p>
                  <div className="flex justify-between items-center text-sm text-muted mb-4">
                     Added {formatDistanceToNow(new Date(book.created_at))} ago
                  </div>
                  {!book.is_sold && (
                    <div className="flex gap-2">
                      <button className="btn btn-success" style={{ flex: 1, padding: '0.5rem' }} onClick={() => handleMarkSold(book.id)}>
                        Mark Sold
                      </button>
                      <button className="btn btn-danger" style={{ flex: 1, padding: '0.5rem' }} onClick={() => handleDelete(book.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                  {book.is_sold && (
                    <button className="btn btn-danger" style={{ width: '100%', padding: '0.5rem' }} onClick={() => handleDelete(book.id)}>
                      Delete Record
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-requests' && (
        <div>
          {myRequests.length === 0 ? (
            <p className="text-muted">You haven't made any requests yet.</p>
          ) : (
            <div className="books-grid">
              {myRequests.map(req => (
                <div key={req.id} className="glass-card">
                  <h3 className="text-gradient mb-2">{req.books.title}</h3>
                  <p className="text-muted text-sm mb-4">Requested {formatDistanceToNow(new Date(req.created_at))} ago</p>
                  <p className="mb-2">Status: 
                    <span className={`badge ml-2 ${req.status === 'accepted' ? 'badge-sold' : req.status === 'rejected' ? 'text-danger' : 'badge-pending'}`}>
                      {req.status}
                    </span>
                  </p>
                  {req.status === 'accepted' && req.seller_email && (
                    <div className="mt-4 p-3" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <p className="text-sm mb-2 text-success"><strong>Request Approved!</strong></p>
                      <p className="text-sm mb-3">You can now contact the seller to arrange the exchange.</p>
                      <a href={`mailto:${req.seller_email}`} className="btn btn-primary text-sm" style={{ width: '100%' }}>
                        Email Seller ({req.seller_email})
                      </a>
                    </div>
                  )}
                  {req.books.is_sold && req.status === 'pending' && <p className="text-sm text-danger mt-2">Notice: This book was sold to someone else.</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'incoming-requests' && (
        <div>
          {incomingRequests.length === 0 ? (
            <p className="text-muted">No one has requested your books yet.</p>
          ) : (
            <div className="books-grid">
              {incomingRequests.map(req => (
                <div key={req.id} className="glass-card">
                  <h3 className="text-gradient mb-2">{req.books.title}</h3>
                  <p className="text-muted text-sm mb-4">Requested {formatDistanceToNow(new Date(req.created_at))} ago</p>
                  <p className="mb-4">Status: 
                    <span className={`badge ml-2 ${req.status === 'accepted' ? 'badge-sold' : req.status === 'rejected' ? 'text-danger' : 'badge-pending'}`}>
                      {req.status}
                    </span>
                  </p>
                  <p className="mb-4 text-sm text-muted">Requested by: <strong>{req.buyer_email}</strong></p>
                  
                  {req.status === 'pending' && !req.books.is_sold && (
                    <div className="flex gap-2 mt-4">
                      <button className="btn btn-success" style={{ flex: 1, padding: '0.5rem' }} onClick={() => handleRequestStatus(req.id, 'accepted')}>
                        Accept
                      </button>
                      <button className="btn btn-danger" style={{ flex: 1, padding: '0.5rem' }} onClick={() => handleRequestStatus(req.id, 'rejected')}>
                        Reject
                      </button>
                    </div>
                  )}
                  {req.status === 'accepted' && (
                    <div className="mt-4 p-3" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <p className="text-sm mb-3 text-success"><strong>You approved this request.</strong></p>
                      <a href={`mailto:${req.buyer_email}`} className="btn btn-outline text-sm" style={{ width: '100%' }}>
                        Email Buyer
                      </a>
                    </div>
                  )}
                  {req.books.is_sold && req.status === 'pending' && (
                    <p className="text-sm text-danger mt-2">You sold this book to someone else.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
