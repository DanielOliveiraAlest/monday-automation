const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const automationEngine = require('../services/automationEngine');

/**
 * Monday webhook challenge handler
 */
router.post('/challenge', (req, res) => {
  const { challenge } = req.body;
  logger.info('Webhook challenge received', { challenge });
  res.json({ challenge });
});

/**
 * Handle item creation
 */
router.post('/item/create', async (req, res) => {
  try {
    const result = await automationEngine.processWebhookEvent({
      ...req.body,
      type: 'create_item'
    });
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Item creation webhook failed:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

/**
 * Handle column value change
 */
router.post('/column/change', async (req, res) => {
  try {
    const result = await automationEngine.processWebhookEvent({
      ...req.body,
      type: 'change_column_value'
    });
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Column change webhook failed:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

/**
 * Handle status change
 */
router.post('/status/change', async (req, res) => {
  try {
    const result = await automationEngine.processWebhookEvent({
      ...req.body,
      type: 'change_status_column_value'
    });
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Status change webhook failed:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

module.exports = router;
