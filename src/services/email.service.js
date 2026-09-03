const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bank System" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, userName) {
  const subject = 'Welcome to Our Bank System';
  const text = `Hello ${userName},\n\nThank you for registering with our bank system. We are excited to have you on board!\n\nBest regards,\nBank System Team`;
  const html = `<p>Hello ${userName},</p><p>Thank you for registering with our bank system. We are excited to have you on board!</p><p>Best regards,<br/>Bank System Team</p>`;

  await sendEmail(userEmail, subject, text, html);

}


async function sendTransactionEmail(userEmail, userName, transactionDetails) {
  const subject = 'Transaction Notification';
  const text = `Hello ${userName},\n\nA transaction has been made on your account:\n\n${transactionDetails}\n\nBest regards,\nBank System Team`;
  const html = `<p>Hello ${userName},</p><p>A transaction has been made on your account:</p><p>${transactionDetails}</p><p>Best regards,<br/>Bank System Team</p>`;

  await sendEmail(userEmail, subject, text, html);

}

async function sendTransactionFailEmail(userEmail,userName,transactionDetails){

  const subject = 'Transaction Failed Notification';
  const text = `Hello ${userName},\n\nYour recent transaction has failed:\n\n${transactionDetails}\n\nPlease check your account and try again.\n\nBest regards,\nBank System Team`;
  const html = `<p>Hello ${userName},</p><p>Your recent transaction has failed:</p><p>${transactionDetails}</p><p>Please check your account and try again.</p><p>Best regards,<br/>Bank System Team</p>`;

  await sendEmail(userEmail,subject,text,html)
}

module.exports = { sendRegistrationEmail, sendTransactionEmail, sendTransactionFailEmail };