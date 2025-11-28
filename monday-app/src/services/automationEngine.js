/**
 * Automation Engine
 * Core automation execution and management
 */

const { logger } = require('../utils/logger');
const mondayService = require('./mondayService');
const { EventEmitter } = require('events');

class AutomationEngine extends EventEmitter {
  constructor() {
    super();
    this.automations = new Map();
    this.executionQueue = [];
    this.isProcessing = false;
    this.initializeDefaultAutomations();
  }

  /**
   * Initialize default automations
   */
  initializeDefaultAutomations() {
    // Status Sync Automation
    this.registerAutomation({
      id: 'sync_status',
      name: 'Status Synchronization',
      execute: async (context) => {
        const { boardId, itemId, columnId, value, token } = context;
        
        // Get connected items
        const itemData = await mondayService.getConnectedItems(itemId, token);
        const connectedItems = this.extractConnectedItems(itemData);
        
        // Update connected items
        const results = [];
        for (const connectedItem of connectedItems) {
          try {
            const result = await mondayService.updateColumnValue(
              connectedItem.boardId,
              connectedItem.itemId,
              columnId,
              value,
              token
            );
            results.push({ success: true, itemId: connectedItem.itemId, result });
          } catch (error) {
            results.push({ success: false, itemId: connectedItem.itemId, error: error.message });
          }
        }
        
        return { 
          success: true, 
          message: `Updated ${results.filter(r => r.success).length} connected items`,
          results 
        };
      }
    });

    // Auto Assignment Automation
    this.registerAutomation({
      id: 'auto_assign',
      name: 'Auto Assignment',
      execute: async (context) => {
        const { boardId, itemId, token } = context;
        
        // Get board users and their workload
        const boards = await mondayService.getBoards(token);
        const targetBoard = boards.boards.find(b => b.id === boardId);
        
        // Simple round-robin assignment logic
        const assigneeColumnId = 'person';
        const users = ['user1', 'user2', 'user3']; // In production, get from board
        const selectedUser = users[Math.floor(Math.random() * users.length)];
        
        await mondayService.updateColumnValue(
          boardId,
          itemId,
          assigneeColumnId,
          JSON.stringify({ personsAndTeams: [{ id: selectedUser, kind: 'person' }] }),
          token
        );
        
        return { success: true, message: `Assigned to ${selectedUser}` };
      }
    });

    // Dependency Check Automation
    this.registerAutomation({
      id: 'dependency_check',
      name: 'Dependency Management',
      execute: async (context) => {
        const { boardId, itemId, columnId, value, token } = context;
        
        // Check if status is "Done" or equivalent
        if (value && value.label && value.label.text === 'Done') {
          // Get dependent items
          const dependencies = await this.getDependencies(itemId, token);
          
          // Update dependent items to "Ready"
          for (const dep of dependencies) {
            await mondayService.updateColumnValue(
              dep.boardId,
              dep.itemId,
              'status',
              JSON.stringify({ label: 'Ready' }),
              token
            );
          }
          
          return { 
            success: true, 
            message: `Updated ${dependencies.length} dependent items` 
          };
        }
        
        return { success: true, message: 'No dependencies to update' };
      }
    });
  }

  /**
   * Register a new automation
   */
  registerAutomation(automation) {
    this.automations.set(automation.id, automation);
    logger.info(`Automation registered: ${automation.id}`);
  }

  /**
   * Execute automation by ID
   */
  async executeAutomation(automationId, context) {
    const automation = this.automations.get(automationId);
    
    if (!automation) {
      throw new Error(`Automation ${automationId} not found`);
    }

    logger.info(`Executing automation: ${automationId}`, { context });
    
    try {
      const startTime = Date.now();
      const result = await automation.execute(context);
      const duration = Date.now() - startTime;
      
      // Log execution
      this.logExecution(automationId, context, result, duration);
      
      // Emit event
      this.emit('automation:executed', {
        automationId,
        context,
        result,
        duration
      });
      
      return result;
    } catch (error) {
      logger.error(`Automation ${automationId} failed:`, error);
      
      // Log failure
      this.logExecution(automationId, context, { error: error.message }, 0, false);
      
      // Emit error event
      this.emit('automation:error', {
        automationId,
        context,
        error
      });
      
      throw error;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event) {
    const { boardId, pulseId: itemId, columnId, value, type } = event;
    
    logger.info('Processing webhook event', { type, boardId, itemId });
    
    // Determine which automations to trigger
    const triggeredAutomations = [];
    
    if (type === 'change_status_column_value') {
      triggeredAutomations.push('sync_status', 'dependency_check');
    } else if (type === 'create_item') {
      triggeredAutomations.push('auto_assign');
    }
    
    // Execute automations
    const results = [];
    for (const automationId of triggeredAutomations) {
      try {
        const result = await this.executeAutomation(automationId, {
          boardId,
          itemId,
          columnId,
          value,
          token: event.token // Token should be passed with event
        });
        results.push({ automationId, success: true, result });
      } catch (error) {
        results.push({ automationId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Extract connected items from Monday API response
   */
  extractConnectedItems(itemData) {
    const connectedItems = [];
    
    if (!itemData.items || !itemData.items[0]) return connectedItems;
    
    const item = itemData.items[0];
    for (const column of item.column_values) {
      if (column.type === 'board-relation' && column.value) {
        try {
          const value = JSON.parse(column.value);
          if (value.linkedPulseIds) {
            value.linkedPulseIds.forEach(linkedItem => {
              connectedItems.push({
                boardId: linkedItem.linkedBoardId,
                itemId: linkedItem.linkedPulseId
              });
            });
          }
        } catch (e) {
          logger.error('Failed to parse connected items:', e);
        }
      }
    }
    
    return connectedItems;
  }

  /**
   * Get item dependencies
   */
  async getDependencies(itemId, token) {
    // This would query for items that depend on the given item
    // For now, returning mock data
    return [];
  }

  /**
   * Log automation execution
   */
  logExecution(automationId, context, result, duration, success = true) {
    const log = {
      automationId,
      timestamp: new Date().toISOString(),
      context,
      result,
      duration,
      success
    };
    
    // In production, save to database
    logger.info('Automation execution logged', log);
  }

  /**
   * Get automation by ID
   */
  async getAutomation(id) {
    const automation = this.automations.get(id);
    if (!automation) return null;
    
    return {
      id: automation.id,
      name: automation.name,
      description: automation.description,
      enabled: automation.enabled !== false
    };
  }

  /**
   * Create new automation
   */
  async createAutomation(data) {
    const automation = {
      id: `custom_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    this.automations.set(automation.id, automation);
    return automation;
  }

  /**
   * Update automation
   */
  async updateAutomation(id, updates) {
    const automation = this.automations.get(id);
    if (!automation) throw new Error('Automation not found');
    
    Object.assign(automation, updates);
    return automation;
  }

  /**
   * Toggle automation
   */
  async toggleAutomation(id, enabled) {
    const automation = this.automations.get(id);
    if (!automation) throw new Error('Automation not found');
    
    automation.enabled = enabled;
    return automation;
  }

  /**
   * Delete automation
   */
  async deleteAutomation(id) {
    return this.automations.delete(id);
  }

  /**
   * Get automation logs
   */
  async getAutomationLogs(id, options) {
    // In production, query from database
    return {
      logs: [],
      total: 0
    };
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(id) {
    // In production, aggregate from database
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      lastExecution: null
    };
  }
}

module.exports = new AutomationEngine();
