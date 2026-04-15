const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendVerificationEmail = async (email, name, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"Campus Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎓 Verify Your Campus Marketplace Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6C63FF, #FF6584); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .body { padding: 40px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6C63FF, #FF6584); color: white; padding: 16px 36px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Campus Marketplace</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Where students trade smart</p>
          </div>
          <div class="body">
            <h2>Hey ${name}! 👋</h2>
            <p>Welcome to Campus Marketplace! We just need to verify your college email to get you started.</p>
            <p>Click the button below to verify your account:</p>
            <center><a href="${verificationUrl}" class="button">Verify My Account</a></center>
            <p style="color: #999; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>Campus Marketplace — For students, by students</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, name, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Campus Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 Reset Your Password - Campus Marketplace',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #6C63FF, #FF6584); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .body { padding: 40px; }
          .button { display: inline-block; background: #FF6584; color: white; padding: 16px 36px; border-radius: 50px; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🔑 Password Reset</h1></div>
          <div class="body">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password. Click below to proceed:</p>
            <center><a href="${resetUrl}" class="button">Reset Password</a></center>
            <p style="color: #999; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
