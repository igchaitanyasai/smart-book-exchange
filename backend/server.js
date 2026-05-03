const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./supabaseClient');
const authenticateUser = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Helper function to handle errors
const handleError = (res, error, customMessage = "Something went wrong") => {
    console.error(error);
    return res.status(500).json({ error: customMessage, details: error.message });
};

// 1. Get all books (Public but might be used by authenticated users)
// Includes optional search query ?search=... and ?exclude_user=...
app.get('/api/books', async (req, res) => {
    try {
        const { search, exclude_user } = req.query;
        let query = supabase.from('books').select('*').eq('is_sold', false).order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        if (exclude_user) {
            query = query.neq('user_id', exclude_user);
        }

        const { data, error } = await query;
        if (error) throw error;

        // In a real app we might join with an auth.users view, but Supabase doesn't allow direct joins to auth.users from API easily without a public profile table.
        // We will just return the books. If we need author emails, we can fetch them via admin API or rely on a public users table.
        // For simplicity, we just return the books.
        res.json(data);
    } catch (err) {
        handleError(res, err, "Failed to fetch books");
    }
});

// 2. Get my books (Protected)
app.get('/api/books/my-books', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        handleError(res, err, "Failed to fetch your books");
    }
});

// 3. Add a book (Protected)
app.post('/api/books', authenticateUser, async (req, res) => {
    try {
        const { title, author, price } = req.body;
        if (!title || !author || price == null) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { data, error } = await supabase
            .from('books')
            .insert([{ title, author, price, user_id: req.user.id }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        handleError(res, err, "Failed to add book");
    }
});

// 4. Delete a book (Protected, Owner only)
app.delete('/api/books/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        // First check if the user owns the book
        const { data: book, error: fetchError } = await supabase.from('books').select('user_id').eq('id', id).single();
        if (fetchError || !book) return res.status(404).json({ error: "Book not found" });
        if (book.user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized to delete this book" });

        const { error } = await supabase.from('books').delete().eq('id', id);
        if (error) throw error;

        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        handleError(res, err, "Failed to delete book");
    }
});

// 5. Mark a book as sold (Protected, Owner only)
app.patch('/api/books/:id/sold', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: book, error: fetchError } = await supabase.from('books').select('user_id').eq('id', id).single();
        if (fetchError || !book) return res.status(404).json({ error: "Book not found" });
        if (book.user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized to update this book" });

        const { error } = await supabase.from('books').update({ is_sold: true }).eq('id', id);
        if (error) throw error;

        res.json({ message: "Book marked as sold" });
    } catch (err) {
        handleError(res, err, "Failed to update book");
    }
});

// 6. Request a book (Protected)
app.post('/api/requests', authenticateUser, async (req, res) => {
    try {
        const { book_id } = req.body;
        if (!book_id) return res.status(400).json({ error: "Missing book_id" });

        // Check if book exists and is not sold
        const { data: book, error: fetchError } = await supabase.from('books').select('*').eq('id', book_id).single();
        if (fetchError || !book) return res.status(404).json({ error: "Book not found" });
        if (book.is_sold) return res.status(400).json({ error: "Book is already sold" });
        if (book.user_id === req.user.id) return res.status(400).json({ error: "You cannot request your own book" });

        // Check if already requested
        const { data: existingReq, error: reqError } = await supabase
            .from('requests')
            .select('*')
            .eq('book_id', book_id)
            .eq('buyer_id', req.user.id)
            .maybeSingle();
        
        if (existingReq) return res.status(400).json({ error: "You have already requested this book" });

        const { data, error } = await supabase
            .from('requests')
            .insert([{ book_id, buyer_id: req.user.id }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        handleError(res, err, "Failed to request book");
    }
});

// 7. Get my requests (Protected - requests I made)
app.get('/api/requests/my-requests', authenticateUser, async (req, res) => {
    try {
        // To get the book details as well
        const { data, error } = await supabase
            .from('requests')
            .select(`
                id, status, created_at,
                books ( id, title, author, price, is_sold, user_id )
            `)
            .eq('buyer_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        // Fetch seller emails for accepted requests
        const enrichedData = await Promise.all(data.map(async (request) => {
            if (request.status === 'accepted' && request.books?.user_id) {
                try {
                    const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(request.books.user_id);
                    if (!authError && userAuth.user) {
                        return { ...request, seller_email: userAuth.user.email };
                    }
                } catch (e) {
                    console.error("Failed to fetch seller email", e);
                }
                return { ...request, seller_email: 'Unknown User' };
            }
            return request;
        }));

        res.json(enrichedData);
    } catch (err) {
        handleError(res, err, "Failed to fetch your requests");
    }
});

// 8. Get incoming requests (Protected - requests for my books)
app.get('/api/requests/incoming', authenticateUser, async (req, res) => {
    try {
        // This is a bit more complex. We need to find requests where book_id matches books owned by req.user.id
        const { data: myBooks, error: booksError } = await supabase.from('books').select('id').eq('user_id', req.user.id);
        if (booksError) throw booksError;

        if (myBooks.length === 0) return res.json([]);

        const bookIds = myBooks.map(b => b.id);
        
        const { data, error } = await supabase
            .from('requests')
            .select(`
                id, status, created_at, buyer_id, book_id,
                books ( id, title, author, price, is_sold )
            `)
            .in('book_id', bookIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch emails for the buyers using Supabase Admin API
        const enrichedData = await Promise.all(data.map(async (request) => {
            try {
                const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(request.buyer_id);
                if (!authError && userAuth.user) {
                    return { ...request, buyer_email: userAuth.user.email };
                }
            } catch (e) {
                console.error("Failed to fetch user email", e);
            }
            return { ...request, buyer_email: 'Unknown User' };
        }));

        res.json(enrichedData);
    } catch (err) {
        handleError(res, err, "Failed to fetch incoming requests");
    }
});

// 9. Update Request Status (Accept/Reject)
app.patch('/api/requests/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        // Fetch the request to get the book_id
        const { data: request, error: fetchReqError } = await supabase
            .from('requests')
            .select('book_id, status')
            .eq('id', id)
            .single();

        if (fetchReqError || !request) return res.status(404).json({ error: "Request not found" });
        if (request.status !== 'pending') return res.status(400).json({ error: "Request is already processed" });

        // Verify the user owns the book being requested
        const { data: book, error: fetchBookError } = await supabase
            .from('books')
            .select('user_id, is_sold')
            .eq('id', request.book_id)
            .single();

        if (fetchBookError || !book) return res.status(404).json({ error: "Book not found" });
        if (book.user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized to modify this request" });
        if (book.is_sold) return res.status(400).json({ error: "Book is already sold" });

        // Update the request status
        const { error: updateReqError } = await supabase
            .from('requests')
            .update({ status })
            .eq('id', id);

        if (updateReqError) throw updateReqError;

        // If accepted, mark the book as sold and reject all other pending requests for this book
        if (status === 'accepted') {
            await supabase.from('books').update({ is_sold: true }).eq('id', request.book_id);
            await supabase.from('requests')
                .update({ status: 'rejected' })
                .eq('book_id', request.book_id)
                .eq('status', 'pending')
                .neq('id', id);
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (err) {
        handleError(res, err, "Failed to update request");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
