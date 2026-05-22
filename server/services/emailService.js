const nodemailer = require('nodemailer');

const isMock = process.env.EMAIL_SERVICE_MOCK === 'true';

// Transporter configuration
let transporter;
if (!isMock) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Sends a registration/join invitation email to a team member.
 * @param {string} email - Recipient email
 * @param {string} teamName - Name of the team they are invited to join
 * @param {string} inviteLink - Confirmation link URL containing the token
 * @returns {Promise<boolean>}
 */
async function sendTeamInvitation(email, teamName, inviteLink) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SEAL Hackathon" <no-reply@domain.com>',
    to: email,
    subject: `[SEAL Hackathon] Confirm your participation in team "${teamName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">SEAL Hackathon Team Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited to join the team <strong>"${teamName}"</strong> for the upcoming SEAL Hackathon event.</p>
        <p>To participate in this team, you must confirm your email registration by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm Invitation</a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">${inviteLink}</p>
        <p style="margin-top: 30px; font-size: 14px; color: #888;">Note: All team members must confirm their participation before the registration deadline or before the maximum capacity is reached for the team to be official.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px; margin-bottom: 20px;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">SEAL Hackathon Platform &copy; 2026</p>
      </div>
    `
  };

  if (isMock) {
    console.log('\n--- [EMAIL MOCK SERVICE] ---');
    console.log(`To: ${email}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Confirmation Link: ${inviteLink}`);
    console.log('----------------------------\n');
    return true;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email via Ethereal/SMTP:', error);
    // Fall back to console print if real fails, so app doesn't break
    console.log('\n--- [EMAIL MOCK FALLBACK] ---');
    console.log(`To: ${email}`);
    console.log(`Confirmation Link: ${inviteLink}`);
    console.log('-----------------------------\n');
    return true;
  }
}

module.exports = {
  sendTeamInvitation
};
