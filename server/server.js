require('dotenv').config(); // Load environment variables from .env file
const WebSocket = require('ws');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure transporter for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Gmail account email
        pass: process.env.EMAIL_PASS // Gmail account password
    }
});

// Function to send email
function sendEmail(receiverEmail, key) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiverEmail,
        subject: 'Your Authentication Key',
        text: `Your authentication key is: ${key}`
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

const wss = new WebSocket.Server({ port: 8080 });

// User credentials (replace with your actual user data)
const users = [
    { userid: 'user1', password: 'password1' },
    { userid: 'user2', password: 'password2' }
];

// Function to generate challenge
function generateChallenge() {
    return crypto.randomBytes(16).toString('hex');
}

// Function to calculate response hash
function calculateResponse(challenge, secretKey) {
    return crypto.createHash('sha256').update(challenge + secretKey).digest('hex');
}

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function incoming(message) {
        console.log('Received authentication details from client:', message);

        const { userid, password, key } = JSON.parse(message);

        // Find user in users array
        const user = users.find(u => u.userid === userid);

        if (user && user.password === password) {
            // Generate and send challenge to client
            const challenge = generateChallenge();
            console.log('Sending challenge to client:', challenge);
            ws.send(challenge);

            // Verify response
            ws.once('message', function verifyResponse(response) {
                console.log('Received response from client:', response);

                if (response === calculateResponse(challenge, key)) {
                    console.log('Authentication successful');
                    ws.send('Authentication successful');
                    // Send key to user's email
                    sendEmail(user.userid, key);
                } else {
                    console.log('Authentication failed');
                    ws.send('Authentication failed');
                }
            });
        } else {
            console.log('Invalid userid or password');
            ws.send('Invalid userid or password');
        }
    });
});
