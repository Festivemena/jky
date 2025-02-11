require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Define schema
const wordSchema = new mongoose.Schema({
    words: String // Changed from array to string
});

// Create model
const Word = mongoose.model('Word', wordSchema);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Route to handle POST requests
app.post('/words', async (req, res) => {
    const { words } = req.body;

    if (!words) {
        return res.status(400).json({ error: 'Please provide words.' });
    }

    try {
        const newWordEntry = new Word({ words });
        await newWordEntry.save();

        // Send email
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['festusmena9@gmail.com'], // Add another email if needed
            subject: 'Words Saved Successfully!',
            html: `<p>You have successfully saved your words:</p><p>${words}</p>` // No mapping, plain string
        });

        res.status(201).json({ message: 'Words saved successfully and email sent!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});