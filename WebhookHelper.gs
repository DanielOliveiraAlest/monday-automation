/**
 * Monday.com Webhook Helper Functions
 * 
 * Funções auxiliares para gerenciar webhooks do Monday.com
 * 
 * @version 1.0.0
 */

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

/**
 * Create webhook via Monday.com API
 * 
 * @param {String} boardId - Board ID where webhook will be created
 * @param {String} callbackUrl - Your Apps Script webhook URL
 * @param {Array} events - Array of events to subscribe to
 * @returns {Object} Webhook creation response
 */
function createMondayWebhook(boardId, callbackUrl, events) {
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  if (!apiKey) {
    throw new Error('MONDAY_API_KEY not configured');
  }
  
  var query = `
    mutation {
      create_webhook (
        board_id: ${boardId},
        url: "${callbackUrl}",
        event: ${JSON.stringify(events[0])},
        config: {
          headers: [
            {
              name: "Content-Type",
              value: "application/json"
            }
          ]
        }
      ) {
        id
        board_id
        url
        event
      }
    }
  `;
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': apiKey,
      'API-Version': '2023-10'
    },
    'payload': JSON.stringify({ query: query }),
    'muteHttpExceptions': true
  };
  
  var response = UrlFetchApp.fetch('https://api.monday.com/v2', options);
  var result = JSON.parse(response.getContentText());
  
  Logger.log('Webhook creation response: ' + JSON.stringify(result));
  
  if (result.errors) {
    throw new Error('Failed to create webhook: ' + JSON.stringify(result.errors));
  }
  
  return result.data.create_webhook;
}

/**
 * List all webhooks for a board
 * 
 * @param {String} boardId - Board ID
 * @returns {Array} Array of webhooks
 */
function listBoardWebhooks(boardId) {
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  var query = `
    query {
      boards (ids: ${boardId}) {
        webhooks {
          id
          url
          event
          active
        }
      }
    }
  `;
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': apiKey,
      'API-Version': '2023-10'
    },
    'payload': JSON.stringify({ query: query }),
    'muteHttpExceptions': true
  };
  
  var response = UrlFetchApp.fetch('https://api.monday.com/v2', options);
  var result = JSON.parse(response.getContentText());
  
  if (result.errors) {
    throw new Error('Failed to list webhooks: ' + JSON.stringify(result.errors));
  }
  
  return result.data.boards[0].webhooks;
}

/**
 * Delete a webhook
 * 
 * @param {String} webhookId - Webhook ID to delete
 * @returns {Object} Deletion response
 */
function deleteMondayWebhook(webhookId) {
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  var query = `
    mutation {
      delete_webhook (id: ${webhookId}) {
        id
      }
    }
  `;
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': apiKey,
      'API-Version': '2023-10'
    },
    'payload': JSON.stringify({ query: query }),
    'muteHttpExceptions': true
  };
  
  var response = UrlFetchApp.fetch('https://api.monday.com/v2', options);
  var result = JSON.parse(response.getContentText());
  
  Logger.log('Webhook deletion response: ' + JSON.stringify(result));
  
  if (result.errors) {
    throw new Error('Failed to delete webhook: ' + JSON.stringify(result.errors));
  }
  
  return result.data.delete_webhook;
}

// ============================================================================
// WEBHOOK TESTING
// ============================================================================

/**
 * Test webhook creation for our test board
 */
function testCreateWebhook() {
  var boardId = '18390046494'; // Board ORIGEM
  var callbackUrl = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_TEST_URL') || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  var events = ['column_value_changed'];
  
  try {
    var webhook = createMondayWebhook(boardId, callbackUrl, events);
    Logger.log('✅ Webhook created successfully!');
    Logger.log('Webhook ID: ' + webhook.id);
    Logger.log('Board ID: ' + webhook.board_id);
    Logger.log('URL: ' + webhook.url);
    Logger.log('Event: ' + webhook.event);
    
    // Save webhook ID for reference
    PropertiesService.getScriptProperties()
      .setProperty('TEST_WEBHOOK_ID', webhook.id);
    
    return webhook;
    
  } catch (e) {
    Logger.log('❌ Failed to create webhook: ' + e);
    return null;
  }
}

/**
 * Test listing webhooks
 */
function testListWebhooks() {
  var boardId = '18390046494'; // Board ORIGEM
  
  try {
    var webhooks = listBoardWebhooks(boardId);
    Logger.log('📋 Webhooks for board ' + boardId + ':');
    
    for (var i = 0; i < webhooks.length; i++) {
      var webhook = webhooks[i];
      Logger.log('- ID: ' + webhook.id);
      Logger.log('  URL: ' + webhook.url);
      Logger.log('  Event: ' + webhook.event);
      Logger.log('  Active: ' + webhook.active);
      Logger.log('');
    }
    
    return webhooks;
    
  } catch (e) {
    Logger.log('❌ Failed to list webhooks: ' + e);
    return null;
  }
}

/**
 * Test webhook deletion
 */
function testDeleteWebhook() {
  var webhookId = PropertiesService.getScriptProperties()
    .getProperty('TEST_WEBHOOK_ID');
  
  if (!webhookId) {
    Logger.log('⚠️  No test webhook ID found. Run testCreateWebhook() first.');
    return;
  }
  
  try {
    var result = deleteMondayWebhook(webhookId);
    Logger.log('✅ Webhook deleted successfully!');
    Logger.log('Deleted webhook ID: ' + result.id);
    
    // Clear saved webhook ID
    PropertiesService.getScriptProperties()
      .deleteProperty('TEST_WEBHOOK_ID');
    
    return result;
    
  } catch (e) {
    Logger.log('❌ Failed to delete webhook: ' + e);
    return null;
  }
}

/**
 * Complete webhook test cycle
 */
function testWebhookCycle() {
  Logger.log('🔄 Starting webhook test cycle...');
  
  // 1. Create webhook
  var webhook = testCreateWebhook();
  if (!webhook) {
    Logger.log('❌ Webhook creation failed. Stopping test.');
    return;
  }
  
  // Wait a moment for webhook to be active
  Utilities.sleep(2000);
  
  // 2. List webhooks
  var webhooks = testListWebhooks();
  
  // 3. Clean up - delete test webhook
  Logger.log('🧹 Cleaning up test webhook...');
  testDeleteWebhook();
  
  Logger.log('✅ Webhook test cycle completed!');
}

// ============================================================================
// WEBHOOK VALIDATION
// ============================================================================

/**
 * Validate webhook configuration
 */
function validateWebhookConfig() {
  Logger.log('🔍 Validating webhook configuration...');
  
  var checks = [];
  
  // Check API key
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  checks.push({
    name: 'MONDAY_API_KEY',
    status: apiKey ? '✅' : '❌',
    value: apiKey ? 'Configured' : 'Missing'
  });
  
  // Check webhook URL
  var webhookUrl = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_TEST_URL');
  checks.push({
    name: 'WEBHOOK_TEST_URL',
    status: webhookUrl ? '✅' : '❌',
    value: webhookUrl || 'Not set'
  });
  
  // Check board IDs
  var allowedBoards = PropertiesService.getScriptProperties()
    .getProperty('ALLOWED_BOARDS');
  checks.push({
    name: 'ALLOWED_BOARDS',
    status: allowedBoards ? '✅' : '⚠️',
    value: allowedBoards || 'Not configured (allowing all)'
  });
  
  // Print results
  Logger.log('📊 Configuration Check Results:');
  for (var i = 0; i < checks.length; i++) {
    var check = checks[i];
    Logger.log(check.status + ' ' + check.name + ': ' + check.value);
  }
  
  return checks;
}
