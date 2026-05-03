import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Search } from 'lucide-react';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { session, user } = useAuth();
  const token = session?.access_token;

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = new URL(`${API_URL}/api/books`);
      if (search) url.searchParams.append('search', search);
      if (user?.id) url.searchParams.append('exclude_user', user.id);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch books");
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBooks();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleRequest = async (bookId) => {
    if (!token) {
      alert("Please login to request a book");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_id: bookId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      alert("Book requested successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Available Books</h2>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by title..."
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading books...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : books.length === 0 ? (
        <div className="loading-container">
          <p>No books found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <div key={book.id} className="glass-card">
              <h3 className="text-gradient" style={{ marginBottom: '0.5rem' }}>{book.title}</h3>
              <p className="text-muted text-sm">By {book.author}</p>
              <div className="flex justify-between items-center mt-4">
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${book.price}</span>
                <span className="text-sm text-muted">
                  Added {formatDistanceToNow(new Date(book.created_at))} ago
                </span>
              </div>
              <button 
                className="btn btn-primary mt-4" 
                style={{ width: '100%' }}
                onClick={() => handleRequest(book.id)}
              >
                Request Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
