const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node to prefer IPv4 when resolving hostnames — fixes ENETUNREACH
// errors on networks where IPv6 routing to Gmail's servers is broken.
dns.setDefaultResultOrder('ipv4first');

const createTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465, // true = SSL (port 465), false = STARTTLS (port 587)
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send clearance certificate email to the student.
 */
const sendClearanceEmail = async ({ to, studentName, matricNo, department }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #333; background: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
        .header { background: #1a1a2e; color: #fff; padding: 28px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.7; }
        .body { padding: 32px; }
        .body h2 { color: #1a1a2e; margin-top: 0; }
        .detail-box { background: #f0f4ff; border-left: 4px solid #4a47a3; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
        .detail-box p { margin: 4px 0; font-size: 14px; }
        .badge { display: inline-block; background: #22c55e; color: #fff; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 16px 0; }
        .footer { text-align: center; padding: 20px 32px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FiDAS — FUTO Clearance System</h1>
          <p>Federal University of Technology, Owerri</p>
        </div>
        <div class="body">
          <h2>Clearance Confirmed ✅</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>
            We are pleased to inform you that your final year clearance has been
            <strong>successfully verified</strong> by the FiDAS system. All five
            required documents have passed forensic authentication.
          </p>
          <div class="badge">CLEARED</div>
          <div class="detail-box">
            <p><strong>Name:</strong> ${studentName}</p>
            <p><strong>Registration Number:</strong> ${matricNo}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Clearance Date:</strong> ${new Date().toDateString()}</p>
          </div>
          <p>
            You may now proceed to the Student Affairs office to collect your
            physical clearance letter. Please present this email as proof of
            digital clearance.
          </p>
          <p>Congratulations on completing your studies at FUTO!</p>
        </div>
        <div class="footer">
          This is an automated message from FiDAS. Do not reply to this email.<br/>
          © ${new Date().getFullYear()} Federal University of Technology, Owerri — Department of Computer Science
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '✅ FiDAS — Your Final Year Clearance is Confirmed',
    html,
  });
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async ({ to, studentName, resetUrl }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 560px; margin: 40px auto; }
        .btn { display: inline-block; background: #4a47a3; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .note { font-size: 12px; color: #999; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>FiDAS — Password Reset</h2>
        <p>Hello ${studentName},</p>
        <p>You requested a password reset for your FiDAS account. Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}" class="btn">Reset My Password</a>
        <p>If you did not request this, please ignore this email — your password will remain unchanged.</p>
        <p class="note">If the button does not work, copy and paste this link into your browser:<br/>${resetUrl}</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'FiDAS — Password Reset Request',
    html,
  });
};
const sendContactMessage = async ({ name, email, message }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">📩 New FiDAS Contact Message</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: 'christianuchenna737@gmail.com',
    replyTo: email,
    subject: `FiDAS Contact Form — Message from ${name}`,
    html,
  });
};
module.exports = { sendClearanceEmail, sendPasswordResetEmail, sendContactMessage };
