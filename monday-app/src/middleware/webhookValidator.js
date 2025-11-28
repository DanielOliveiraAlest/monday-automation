const crypto = require('crypto');
const { logger } = require('../utils/logger');

const validateWebhook = (req, res, next) => {
  const signature = req.headers['x-monday-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret) {
    logger.warn('Webhook validation failed: missing signature or secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Webhook validation failed: invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

module.exports = { validateWebhook };
