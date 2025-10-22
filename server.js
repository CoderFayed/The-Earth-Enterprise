const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML files

// Initialize SQLite Database
const db = new sqlite3.Database('./earth_enterprise.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

// Create transactions table
function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Transactions table ready.');
        }
    });
}

// API Routes

// Get all transactions
app.get('/api/transactions', (req, res) => {
    const sql = `SELECT * FROM transactions ORDER BY date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new transaction
app.post('/api/transactions', (req, res) => {
    const { date, amount, type, note } = req.body;
    const sql = `INSERT INTO transactions (date, amount, type, note) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [date, amount, type, note], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Transaction added successfully',
            id: this.lastID
        });
    });
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM transactions WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Transaction deleted', changes: this.changes });
    });
});

// Clear all transactions
app.delete('/api/transactions', (req, res) => {
    const sql = `DELETE FROM transactions`;
    
    db.run(sql, [], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'All transactions cleared', changes: this.changes });
    });
});

// Get summary statistics
app.get('/api/summary', (req, res) => {
    const sql = `
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
        FROM transactions
    `;
    
    db.get(sql, [], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Earth Enterprise Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: earth_enterprise.db`);
    console.log(`💻 Access from other devices: http://YOUR-IP:${PORT}`);
});
