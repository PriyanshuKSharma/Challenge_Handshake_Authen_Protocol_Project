require('dotenv').config(); // Load environment variables from .env file
const WebSocket = require('ws');
const nodemailer = require('nodemailer');

// Configure transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// User credentials (replace with your actual user data)
const users = {
    user1: { password: 'password1', email: 'user1@example.com', key: 'generated_key1' },
    user2: { password: 'password2', email: 'user2@example.com', key: 'generated_key2' }
};

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function incoming(message) {
        console.log('Received authentication details from client:', message);

        const { userid, password, email, key } = JSON.parse(message);

        // Find user in users object
        const user = users[userid];

        if (user && user.password === password && user.email === email && user.key === key) {
            console.log('Authentication successful');
            ws.send('Authentication successful');
            // Send email verification
            sendEmailVerification(email);
        } else {
            console.log('Authentication failed');
            ws.send('Authentication failed');
        }
    });
});

// Function to send email verification
function sendEmailVerification(receiverEmail) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiverEmail,
        subject: 'Email Verification',
        text: 'Your email has been successfully verified.'
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email verification sent:', info.response);
        }
    });
}
