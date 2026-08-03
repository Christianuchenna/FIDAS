const { sendContactMessage } = require('../services/email.service');

const submitContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (message.length > 3000) {
      return res.status(400).json({ success: false, message: 'Message is too long.' });
    }

    await sendContactMessage({ name, email, message });

    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
};

module.exports = { submitContactMessage };