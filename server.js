// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Make sure .env has SENDGRID_API_KEY

app.post('/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  const msg = {
  to: email,
  from: 'noreplyraseed@gmail.com',
  subject: 'Your One-Time Password (OTP) for Raseed Verification',
  text: `Hello,

Thank you for choosing Raseed.

Your One-Time Password (OTP) is: ${otp}

Please enter this code in the app to verify your email address. 
This OTP is valid for the next 10 minutes. Do not share this code with anyone.

If you did not request this code, please ignore this message.

Best regards,  
The Raseed Team`,
  html: `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      <p>Hello,</p>
      <p>Thank you for choosing <strong>Raseed</strong>.</p>
      <p>Your One-Time Password (OTP) is:</p>
      <div style="font-size: 24px; font-weight: bold; color: #2e2d63; margin: 10px 0;">
        ${otp}
      </div>
      <p>Please enter this code in the app to verify your email address.</p>
      <p><strong>This OTP is valid for the next 10 minutes.</strong></p>
      <p style="color: #888;">Do not share this code with anyone.</p>
      <hr />
      <p style="font-size: 14px; color: #999;">If you did not request this code, please ignore this email.</p>
      <p style="font-size: 14px; color: #999;">— The Raseed Team</p>
    </div>
  `
};


  try {
    await sgMail.send(msg);
    res.status(200).json({ message: 'OTP email sent successfully' });
  } catch (error) {
    console.error('SendGrid Error:', error.response?.body || error.message);
    res.status(500).json({ message: 'Failed to send OTP email' });
  }
});

app.listen(8082, () => console.log('Email OTP server running on port 8082'));
