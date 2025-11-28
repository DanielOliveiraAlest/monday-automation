/**
 * Automation Routes
 * Core automation logic and management
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const mondayService = require('../services/mondayService');
const automationEngine = require('../services/automationEngine');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * List all available automations
 */
router.get('/list', async (req, res) => {
  try {
    const automations = [
      {
        id: 'sync_status',
        name: 'Status Synchronization',
        description: 'Sync status between connected items',
        category: 'synchronization',
        enabled: true,
        config: {
          trigger: 'status_change',
          action: 'update_connected_status'
        }
      },
      {
        id: 'auto_assign',
        name: 'Auto Assignment',
        description: 'Automatically assign items based on rules',
        category: 'assignment',
        enabled: true,
        config: {
          trigger: 'item_created',
          action: 'assign_by_workload'
        }
      },
      {
        id: 'deadline_alert',
        name: 'Deadline Alerts',
        description: 'Send alerts for approaching deadlines',
        category: 'notification',
        enabled: true,
        config: {
          trigger: 'daily_check',
          action: 'send_deadline_notifications'
        }
      },
      {
        id: 'dependency_check',
        name: 'Dependency Management',
        description: 'Check and update item dependencies',
        category: 'workflow',
        enabled: true,
        config: {
          trigger: 'status_change',
          action: 'update_dependencies'
        }
      },
      {
        id: 'mirror_updates',
        name: 'Mirror Updates',
        description: 'Mirror updates between related items',
        category: 'synchronization',
        enabled: false,
        config: {
          trigger: 'update_posted',
          action: 'copy_to_connected'
        }
      }
    ];

    res.json({ automations, total: automations.length });
  } catch (error) {
    logger.error('Failed to list automations:', error);
    res.status(500).json({ error: 'Failed to retrieve automations' });
  }
});

/**
 * Get automation details
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const automation = await automationEngine.getAutomation(id);
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    res.json(automation);
  } catch (error) {
    logger.error(`Failed to get automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve automation' });
  }
});

/**
 * Create new automation
 */
router.post('/create', async (req, res) => {
  const { name, description, trigger, action, config } = req.body;
  const { mondayToken } = req.user;

  try {
    const automation = await automationEngine.createAutomation({
      name,
      description,
      trigger,
      action,
      config,
      createdBy: req.user.userId,
      accountId: req.user.accountId
    });

    logger.info('Automation created', { automationId: automation.id, userId: req.user.userId });
    res.status(201).json(automation);
  } catch (error) {
    logger.error('Failed to create automation:', error);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

/**
 * Update automation
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const automation = await automationEngine.updateAutomation(id, updates);
    logger.info('Automation updated', { automationId: id });
    res.json(automation);
  } catch (error) {
    logger.error(`Failed to update automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

/**
 * Enable/disable automation
 */
router.patch('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  try {
    const automation = await automationEngine.toggleAutomation(id, enabled);
    logger.info(`Automation ${enabled ? 'enabled' : 'disabled'}`, { automationId: id });
    res.json(automation);
  } catch (error) {
    logger.error(`Failed to toggle automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to toggle automation' });
  }
});

/**
 * Delete automation
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await automationEngine.deleteAutomation(id);
    logger.info('Automation deleted', { automationId: id });
    res.json({ success: true, message: 'Automation deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

/**
 * Execute automation manually
 */
router.post('/:id/execute', async (req, res) => {
  const { id } = req.params;
  const { boardId, itemId, context } = req.body;
  const { mondayToken } = req.user;

  try {
    const result = await automationEngine.executeAutomation(id, {
      boardId,
      itemId,
      context,
      token: mondayToken,
      userId: req.user.userId
    });

    logger.info('Automation executed manually', { 
      automationId: id, 
      boardId, 
      itemId,
      success: result.success 
    });

    res.json(result);
  } catch (error) {
    logger.error(`Failed to execute automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to execute automation' });
  }
});

/**
 * Get automation logs
 */
router.get('/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  try {
    const logs = await automationEngine.getAutomationLogs(id, { limit, offset });
    res.json(logs);
  } catch (error) {
    logger.error(`Failed to get logs for automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

/**
 * Get automation statistics
 */
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;

  try {
    const stats = await automationEngine.getAutomationStats(id);
    res.json(stats);
  } catch (error) {
    logger.error(`Failed to get stats for automation ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

module.exports = router;
