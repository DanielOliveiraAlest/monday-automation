/**
 * Monday Automation - Main Entry Point
 * 
 * This file handles incoming webhooks from Monday.com and orchestrates
 * the automation flow for syncing status between connected boards.
 * 
 * @version 1.0.0
 * @author Monday Automation Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var DEBUG_MODE = true; // Set to false in production
var VERSION = '1.0.0';

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * Main entry point for POST requests (webhooks)
 * This function is called by Monday.com when an event occurs
 * 
 * @param {Object} e - Event object from Google Apps Script
 * @returns {TextOutput} Response to Monday.com
 */
function doPost(e) {
  try {
    debugLog('=== WEBHOOK RECEIVED ===');
    debugLog('Request parameters', e.parameter);
    
    // ========================================================================
    // STEP 1: Handle Monday.com Challenge (Webhook Verification)
    // ========================================================================
    // Monday sends a challenge when you first configure the webhook
    // We must respond with the same challenge value
    
    if (e.parameter && e.parameter.challenge) {
      debugLog('Challenge received', e.parameter.challenge);
      return createJsonResponse({ challenge: e.parameter.challenge });
    }
    
    // ========================================================================
    // STEP 2: Validate Webhook Token (Security)
    // ========================================================================
    
    if (!validateWebhookToken(e)) {
      Logger.log('[ERROR] Invalid webhook token');
      return createJsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    debugLog('Token validation: PASSED');
    
    // ========================================================================
    // STEP 3: Parse Webhook Payload
    // ========================================================================
    
    var payload = parsePayload(e);
    if (!payload) {
      Logger.log('[ERROR] Invalid payload');
      return createJsonResponse({ error: 'Invalid payload' }, 400);
    }
    
    debugLog('Payload parsed', payload);
    
    // ========================================================================
    // STEP 4: Extract Event Data
    // ========================================================================
    
    var eventData = extractEventData(payload);
    if (!eventData) {
      Logger.log('[ERROR] Could not extract event data');
      return createJsonResponse({ error: 'Invalid event data' }, 400);
    }
    
    debugLog('Event data extracted', eventData);
    
    // ========================================================================
    // STEP 5: Validate Board is Allowed (Whitelist)
    // ========================================================================
    
    if (!isBoardAllowed(eventData.boardId)) {
      Logger.log('[WARN] Board not in whitelist: ' + eventData.boardId);
      return createJsonResponse({ error: 'Board not allowed' }, 403);
    }
    
    debugLog('Board whitelist: PASSED');
    
    // ========================================================================
    // STEP 6: Process Automation Logic
    // ========================================================================
    // TODO: Implement in Sprint 3
    // This is where we will:
    // - Get linked items
    // - Update status on connected boards
    
    Logger.log('[INFO] Automation logic - TO BE IMPLEMENTED (Sprint 3)');
    
    // ========================================================================
    // STEP 7: Return Success Response
    // ========================================================================
    
    return createJsonResponse({
      status: 'success',
      message: 'Webhook processed successfully',
      version: VERSION
    });
    
  } catch (error) {
    Logger.log('[ERROR] Exception in doPost: ' + error);
    Logger.log('[ERROR] Stack trace: ' + error.stack);
    
    return createJsonResponse({
      error: 'Internal server error',
      message: error.toString()
    }, 500);
  }
}

// ============================================================================
// HTTP GET HANDLER (Health Check)
// ============================================================================

/**
 * Handle GET requests for health checks
 * 
 * @param {Object} e - Event object
 * @returns {TextOutput} Health status
 */
function doGet(e) {
  if (e.parameter && e.parameter.health) {
    return createJsonResponse({
      status: 'ok',
      version: VERSION,
      timestamp: new Date().toISOString()
    });
  }
  
  return createJsonResponse({
    service: 'Monday Automation',
    version: VERSION,
    status: 'running'
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate webhook token for security
 * 
 * @param {Object} e - Event object
 * @returns {Boolean} True if token is valid
 */
function validateWebhookToken(e) {
  // Get token from properties
  var expectedToken = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_TOKEN');
  
  if (!expectedToken) {
    Logger.log('[WARN] No WEBHOOK_TOKEN configured in properties');
    return true; // Allow in development mode
  }
  
  // Get token from request header or parameter
  var receivedToken = e.parameter['X-Z-Webhook-Token'] || 
                      (e.headers && e.headers['X-Z-Webhook-Token']);
  
  debugLog('Token comparison', {
    expected: expectedToken,
    received: receivedToken
  });
  
  return receivedToken === expectedToken;
}

/**
 * Parse the webhook payload
 * 
 * @param {Object} e - Event object
 * @returns {Object|null} Parsed payload or null if invalid
 */
function parsePayload(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      Logger.log('[ERROR] No postData in request');
      return null;
    }
    
    var payload = JSON.parse(e.postData.contents);
    return payload;
    
  } catch (error) {
    Logger.log('[ERROR] Failed to parse payload: ' + error);
    return null;
  }
}

/**
 * Extract relevant data from event payload
 * 
 * @param {Object} payload - Webhook payload
 * @returns {Object|null} Event data or null
 */
function extractEventData(payload) {
  try {
    if (!payload.event) {
      Logger.log('[ERROR] No event in payload');
      return null;
    }
    
    var event = payload.event;
    
    return {
      type: event.type,
      boardId: parseInt(event.boardId),
      itemId: parseInt(event.itemId),
      columnId: event.columnId,
      value: event.value
    };
    
  } catch (error) {
    Logger.log('[ERROR] Failed to extract event data: ' + error);
    return null;
  }
}

/**
 * Check if board is in allowed whitelist
 * 
 * @param {Number} boardId - Board ID to check
 * @returns {Boolean} True if allowed
 */
function isBoardAllowed(boardId) {
  var allowedBoards = PropertiesService.getScriptProperties()
    .getProperty('ALLOWED_BOARDS');
  
  if (!allowedBoards) {
    Logger.log('[WARN] No ALLOWED_BOARDS configured - allowing all');
    return true; // Allow all in development
  }
  
  var boardsList = allowedBoards.split(',').map(function(id) {
    return parseInt(id.trim());
  });
  
  return boardsList.indexOf(boardId) !== -1;
}

/**
 * Create JSON response
 * 
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @returns {TextOutput} JSON response
 */
function createJsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  
  var output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Note: Apps Script doesn't support setting HTTP status codes directly
  // The status is included in the response body for debugging
  if (statusCode !== 200) {
    Logger.log('[INFO] Response status: ' + statusCode);
  }
  
  return output;
}

/**
 * Debug logging (only in DEBUG_MODE)
 * 
 * @param {String} message - Log message
 * @param {Object} data - Optional data to log
 */
function debugLog(message, data) {
  if (DEBUG_MODE) {
    Logger.log('[DEBUG] ' + message);
    if (data) {
      Logger.log(JSON.stringify(data, null, 2));
    }
  }
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test function - Simulate webhook call
 * Run this from the Apps Script editor to test locally
 */
function testWebhookSimulation() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        event: {
          type: 'change_column_value',
          boardId: 123456,
          itemId: 789012,
          columnId: 'status',
          value: {
            label: {
              text: 'Done'
            }
          }
        }
      })
    },
    parameter: {
      'X-Z-Webhook-Token': PropertiesService.getScriptProperties()
        .getProperty('WEBHOOK_TOKEN') || 'test_token'
    }
  };
  
  Logger.log('=== TESTING WEBHOOK ===');
  var response = doPost(mockEvent);
  Logger.log('Response: ' + response.getContent());
}

/**
 * Test function - Health check
 */
function testHealthCheck() {
  var response = doGet({ parameter: { health: true } });
  Logger.log('Health check response: ' + response.getContent());
}
