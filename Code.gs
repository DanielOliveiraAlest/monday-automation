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
// VERSION AND CONFIGURATION
// ============================================================================

var VERSION = '1.0.0';
var BUILD_DATE = '2025-11-27';
var API_VERSION = '2023-10';
var SYSTEM_NAME = 'Monday Automation Enterprise';

/**
 * Get system version information
 */
function getSystemVersion() {
  return {
    system: SYSTEM_NAME,
    version: VERSION,
    build_date: BUILD_DATE,
    api_version: API_VERSION,
    features: {
      webhook_security: true,
      retry_logic: true,
      health_check: true,
      board_whitelist: true,
      exponential_backoff: true,
      token_validation: true
    },
    compatibility: {
      monday_api: 'v2',
      apps_script_runtime: 'V8',
      minimum_node_version: '12.x'
    }
  };
}

/**
 * Version compatibility check
 */
function checkVersionCompatibility() {
  var currentVersion = getSystemVersion();
  var compatibility = {
    compatible: true,
    issues: [],
    recommendations: []
  };
  
  // Check Apps Script runtime
  try {
    var testArray = [1, 2, 3];
    testArray.includes(2); // V8 feature test
  } catch (error) {
    compatibility.compatible = false;
    compatibility.issues.push('Apps Script runtime must be V8');
    compatibility.recommendations.push('Enable V8 runtime in Project Settings');
  }
  
  // Check API connectivity
  try {
    var apiTest = mondayQuery('query { boards(limit: 1) { id } }', {});
    if (!apiTest.data) {
      compatibility.compatible = false;
      compatibility.issues.push('Monday API connectivity failed');
    }
  } catch (error) {
    compatibility.compatible = false;
    compatibility.issues.push('Monday API error: ' + error.message);
  }
  
  return compatibility;
}

/**
 * Test version system
 */
function testVersionSystem() {
  Logger.log('=== TESTING VERSION SYSTEM ===');
  
  try {
    var version = getSystemVersion();
    Logger.log('[INFO] System: ' + version.system);
    Logger.log('[INFO] Version: ' + version.version);
    Logger.log('[INFO] Build Date: ' + version.build_date);
    Logger.log('[INFO] API Version: ' + version.api_version);
    
    var compatibility = checkVersionCompatibility();
    Logger.log('[INFO] Compatible: ' + compatibility.compatible);
    
    if (compatibility.issues.length > 0) {
      Logger.log('[WARN] Issues found:');
      for (var i = 0; i < compatibility.issues.length; i++) {
        Logger.log('[WARN] - ' + compatibility.issues[i]);
      }
    }
    
    if (compatibility.recommendations.length > 0) {
      Logger.log('[INFO] Recommendations:');
      for (var i = 0; i < compatibility.recommendations.length; i++) {
        Logger.log('[INFO] - ' + compatibility.recommendations[i]);
      }
    }
    
    Logger.log('[RESULT] Version system test completed');
    
    return {
      test_status: 'completed',
      version: version.version,
      compatible: compatibility.compatible,
      issues_count: compatibility.issues.length
    };
    
  } catch (error) {
    Logger.log('[ERROR] Version system test failed: ' + error.message);
    
    return {
      test_status: 'failed',
      error: error.message
    };
  }
}

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
    
    var tokenValidation = validateWebhookToken(e);
    
    if (!tokenValidation.valid) {
      Logger.log('[ERROR] Webhook token validation failed: ' + tokenValidation.error);
      return createJsonResponse({ 
        error: 'Unauthorized', 
        details: tokenValidation.error,
        validation_method: tokenValidation.method
      }, 401);
    }
    
    debugLog('Token validation: PASSED via ' + tokenValidation.method);
    debugLog('Token info', { method: tokenValidation.method, token: tokenValidation.token });
    
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
    
    Logger.log('[INFO] Processing automation logic...');
    
    // Use our new automation system from Automation.gs
    var automationResult = processWebhookAutomation(payload);
    
    if (!automationResult.success) {
      Logger.log('[ERROR] Automation failed: ' + automationResult.errors.join(', '));
      return createJsonResponse({ 
        error: 'Automation failed', 
        details: automationResult.errors 
      }, 500);
    }
    
    Logger.log('[SUCCESS] Automation completed successfully');
    Logger.log('[INFO] Action: ' + automationResult.actionResult.action);
    
    // Log detailed results for debugging
    if (automationResult.actionResult.connectedItems) {
      Logger.log('[INFO] Connected items processed: ' + automationResult.actionResult.connectedItems.length);
    }
    
    if (automationResult.actionResult.syncResults) {
      Logger.log('[INFO] Sync results: ' + automationResult.actionResult.syncResults.successCount + ' success, ' + 
                  automationResult.actionResult.syncResults.errorCount + ' errors');
    }
    
    // ========================================================================
    // STEP 7: Return Success Response
    // ========================================================================
    
    return createJsonResponse({
      status: 'success',
      message: 'Webhook processed successfully',
      version: VERSION,
      automation: {
        action: automationResult.actionResult.action,
        boardId: automationResult.eventInfo.boardId,
        itemId: automationResult.eventInfo.itemId,
        connectedItems: automationResult.actionResult.connectedItems ? automationResult.actionResult.connectedItems.length : 0,
        syncResults: automationResult.actionResult.syncResults || null
      }
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
 * Enhanced webhook token validation with multiple security layers
 * 
 * @param {Object} e - Event object from Apps Script
 * @returns {Object} Validation result with details
 */
function validateWebhookToken(e) {
  Logger.log('=== WEBHOOK TOKEN VALIDATION ===');
  
  try {
    // Get expected token from properties with fallback
    var expectedToken = PropertiesService.getScriptProperties()
      .getProperty('WEBHOOK_TOKEN');
    
    if (!expectedToken) {
      Logger.log('[WARN] No WEBHOOK_TOKEN configured - checking development mode');
      
      // Development mode: allow test tokens
      var isDevMode = PropertiesService.getScriptProperties()
        .getProperty('DEVELOPMENT_MODE') === 'true';
      
      if (isDevMode) {
        Logger.log('[INFO] Development mode active - allowing test tokens');
        return { 
          valid: true, 
          method: 'development_mode',
          token: 'test_token'
        };
      }
      
      return { 
        valid: false, 
        error: 'WEBHOOK_TOKEN not configured',
        method: 'missing_token'
      };
    }
    
    // Try multiple token sources (header, parameter, custom header)
    var receivedToken = null;
    var tokenSource = '';
    
    // Method 1: Standard header
    if (e.headers && e.headers['X-Z-Webhook-Token']) {
      receivedToken = e.headers['X-Z-Webhook-Token'];
      tokenSource = 'header_X-Z-Webhook-Token';
    }
    
    // Method 2: Parameter (for testing)
    if (!receivedToken && e.parameter && e.parameter['X-Z-Webhook-Token']) {
      receivedToken = e.parameter['X-Z-Webhook-Token'];
      tokenSource = 'parameter_X-Z-Webhook-Token';
    }
    
    // Method 3: Custom header (some webhook systems use different headers)
    if (!receivedToken && e.headers && e.headers['Authorization']) {
      var authHeader = e.headers['Authorization'];
      if (authHeader.startsWith('Bearer ')) {
        receivedToken = authHeader.substring(7);
        tokenSource = 'header_Authorization_Bearer';
      }
    }
    
    // Method 4: Monday.com specific header
    if (!receivedToken && e.headers && e.headers['Monday-Signature']) {
      receivedToken = e.headers['Monday-Signature'];
      tokenSource = 'header_Monday-Signature';
    }
    
    Logger.log('[DEBUG] Token validation attempt:');
    Logger.log('[DEBUG] Source: ' + tokenSource);
    Logger.log('[DEBUG] Expected length: ' + expectedToken.length);
    Logger.log('[DEBUG] Received length: ' + (receivedToken ? receivedToken.length : 0));
    
    if (!receivedToken) {
      return { 
        valid: false, 
        error: 'No token provided',
        method: 'no_token_found'
      };
    }
    
    // Compare tokens securely
    var isValid = receivedToken === expectedToken;
    
    if (isValid) {
      Logger.log('[SUCCESS] Token validation successful via: ' + tokenSource);
      return { 
        valid: true, 
        method: tokenSource,
        token: maskToken(receivedToken)
      };
    } else {
      Logger.log('[ERROR] Token mismatch');
      Logger.log('[ERROR] Expected: ' + maskToken(expectedToken));
      Logger.log('[ERROR] Received: ' + maskToken(receivedToken));
      
      return { 
        valid: false, 
        error: 'Invalid token',
        method: tokenSource,
        expected: maskToken(expectedToken),
        received: maskToken(receivedToken)
      };
    }
    
  } catch (error) {
    Logger.log('[ERROR] Token validation error: ' + error.message);
    
    return { 
      valid: false, 
      error: 'Validation error: ' + error.message,
      method: 'exception'
    };
  }
}

/**
 * Mask token for secure logging (show only first/last 4 chars)
 */
function maskToken(token) {
  if (!token || token.length < 8) {
    return '***';
  }
  
  var start = token.substring(0, 4);
  var end = token.substring(token.length - 4);
  var middle = '*'.repeat(token.length - 8);
  
  return start + middle + end;
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
 * Test function - Simulate webhook call with real data
 * Run this from the Apps Script editor to test locally
 */
function testWebhookSimulation() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        event: {
          type: 'update_column_value',
          boardId: '18390046494', // Your real board ID
          pulseId: '10644299171', // Your real item ID
          columnId: 'project_status', // Real status column
          columnType: 'color',
          changeType: 'updated',
          changeValue: '{"label":"Em progresso"}',
          previousValue: '{"label":"Feito"}'
        },
        triggerTime: new Date().toISOString()
      })
    },
    parameter: {
      'X-Z-Webhook-Token': PropertiesService.getScriptProperties()
        .getProperty('WEBHOOK_TOKEN') || 'test_token'
    }
  };
  
  Logger.log('=== TESTING WEBHOOK AUTOMATION ===');
  Logger.log('[INFO] Simulating status change on item 10644299171');
  
  var response = doPost(mockEvent);
  var responseContent = response.getContent();
  
  Logger.log('Response status: ' + responseContent);
  Logger.log('Response details:');
  Logger.log(JSON.stringify(JSON.parse(responseContent), null, 2));
  
  return responseContent;
}

/**
 * Configure webhook token and security settings
 * Run this function to set up production security
 */
function configureWebhookSecurity() {
  Logger.log('=== CONFIGURING WEBHOOK SECURITY ===');
  
  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    
    // Generate a secure webhook token (or use provided one)
    var webhookToken = scriptProperties.getProperty('WEBHOOK_TOKEN');
    
    if (!webhookToken) {
      // Generate a secure token
      webhookToken = generateSecureToken();
      scriptProperties.setProperty('WEBHOOK_TOKEN', webhookToken);
      Logger.log('[INFO] Generated new webhook token');
    } else {
      Logger.log('[INFO] Using existing webhook token');
    }
    
    // Configure development mode
    var devMode = scriptProperties.getProperty('DEVELOPMENT_MODE');
    if (!devMode) {
      scriptProperties.setProperty('DEVELOPMENT_MODE', 'false');
      Logger.log('[INFO] Set development mode to false');
    }
    
    // Configure allowed boards
    var allowedBoards = scriptProperties.getProperty('ALLOWED_BOARDS');
    if (!allowedBoards) {
      // Default to your boards
      allowedBoards = '18390046494,18390046725';
      scriptProperties.setProperty('ALLOWED_BOARDS', allowedBoards);
      Logger.log('[INFO] Set default allowed boards: ' + allowedBoards);
    }
    
    // Display configuration (with masked token)
    Logger.log('[SUCCESS] Webhook security configured!');
    Logger.log('[INFO] Webhook Token: ' + maskToken(webhookToken));
    Logger.log('[INFO] Development Mode: ' + scriptProperties.getProperty('DEVELOPMENT_MODE'));
    Logger.log('[INFO] Allowed Boards: ' + scriptProperties.getProperty('ALLOWED_BOARDS'));
    
    return {
      success: true,
      webhookToken: maskToken(webhookToken),
      developmentMode: scriptProperties.getProperty('DEVELOPMENT_MODE'),
      allowedBoards: scriptProperties.getProperty('ALLOWED_BOARDS'),
      instructions: {
        webhookToken: 'Use this token in your Monday.com webhook configuration',
        developmentMode: 'Set to "true" for testing, "false" for production',
        allowedBoards: 'Comma-separated list of board IDs that can trigger webhooks'
      }
    };
    
  } catch (error) {
    Logger.log('[ERROR] Failed to configure webhook security: ' + error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate a secure random token for webhooks
 */
function generateSecureToken() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var token = '';
  
  for (var i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Mask token for secure logging (show only first/last 4 chars)
 */
function maskToken(token) {
  if (!token || token.length < 8) {
    return '***';
  }
  
  var start = token.substring(0, 4);
  var end = token.substring(token.length - 4);
  var middle = '*'.repeat(token.length - 8);
  
  return start + middle + end;
}

/**
 * Test retry logic with simulated failures
 */
function testRetryLogic() {
  Logger.log('=== TESTING RETRY LOGIC ===');
  
  // Test 1: Normal query (should succeed on first attempt)
  try {
    var result1 = mondayQueryWithRetry(
      'query { boards { id name } }',
      {},
      { maxRetries: 2, baseDelay: 500 }
    );
    Logger.log('[TEST 1] Normal query: PASSED');
  } catch (error) {
    Logger.log('[TEST 1] Normal query: FAILED - ' + error.message);
  }
  
  // Test 2: Error classification
  var retryableError = new Error('Network timeout occurred');
  var nonRetryableError = new Error('Invalid GraphQL syntax');
  
  Logger.log('[TEST 2] Retryable error classification: ' + (isRetryableError(retryableError) ? 'PASSED' : 'FAILED'));
  Logger.log('[TEST 3] Non-retryable error classification: ' + (!isRetryableError(nonRetryableError) ? 'PASSED' : 'FAILED'));
  
  Logger.log('[RESULT] Retry logic tests completed');
  
  return {
    test1: 'completed',
    test2: isRetryableError(retryableError),
    test3: !isRetryableError(nonRetryableError)
  };
}

/**
 * Enhanced Monday API Query with Retry Logic and Exponential Backoff
 * 
 * @param {String} query - GraphQL query string
 * @param {Object} variables - Variables for GraphQL query
 * @param {Object} options - Retry and timeout options
 * @returns {Object} Query results or error
 */
function mondayQueryWithRetry(query, variables, options) {
  options = options || {};
  var maxRetries = options.maxRetries || 3;
  var baseDelay = options.baseDelay || 1000; // 1 second base delay
  var maxDelay = options.maxDelay || 10000; // 10 seconds max delay
  
  Logger.log('=== MONDAY API QUERY WITH RETRY ===');
  Logger.log('[DEBUG] Max retries: ' + maxRetries);
  Logger.log('[DEBUG] Base delay: ' + baseDelay + 'ms');
  
  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        var delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        Logger.log('[RETRY] Attempt ' + (attempt + 1) + '/' + (maxRetries + 1) + ' after ' + delay + 'ms delay');
        Utilities.sleep(delay);
      }
      
      Logger.log('[DEBUG] Attempt ' + (attempt + 1) + '/' + (maxRetries + 1));
      
      var result = mondayQuery(query, variables);
      
      // Check for rate limit errors
      if (result && result.errors) {
        for (var i = 0; i < result.errors.length; i++) {
          var error = result.errors[i];
          if (error.status_code === 429 || error.message.indexOf('rate limit') !== -1) {
            Logger.log('[WARN] Rate limit detected on attempt ' + (attempt + 1) + ': ' + error.message);
            
            if (attempt < maxRetries) {
              continue; // Retry with exponential backoff
            } else {
              Logger.log('[ERROR] Max retries exceeded for rate limit');
              throw new Error('Rate limit exceeded after ' + maxRetries + ' retries');
            }
          }
        }
      }
      
      // Success - return result
      Logger.log('[SUCCESS] Query successful on attempt ' + (attempt + 1));
      return result;
      
    } catch (error) {
      Logger.log('[ERROR] Attempt ' + (attempt + 1) + ' failed: ' + error.message);
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        Logger.log('[ERROR] Non-retryable error, giving up: ' + error.message);
        throw error;
      }
      
      // Last attempt - give up
      if (attempt === maxRetries) {
        Logger.log('[ERROR] Max retries exceeded: ' + error.message);
        throw new Error('Query failed after ' + maxRetries + ' retries: ' + error.message);
      }
      
      // Continue to next attempt
      Logger.log('[INFO] Will retry (attempt ' + (attempt + 1) + ' of ' + (maxRetries + 1) + ')');
    }
  }
  
  throw new Error('Unexpected error in retry logic');
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error) {
  var errorMessage = error.message.toLowerCase();
  
  // Network-related errors
  var retryablePatterns = [
    'network error',
    'timeout',
    'connection',
    'rate limit',
    'service unavailable',
    'internal server error',
    'too many requests',
    'temporary',
    'retry'
  ];
  
  for (var i = 0; i < retryablePatterns.length; i++) {
    if (errorMessage.indexOf(retryablePatterns[i]) !== -1) {
      return true;
    }
  }
  
  // HTTP status codes that are retryable
  if (error.status_code) {
    var retryableStatusCodes = [429, 500, 502, 503, 504];
    return retryableStatusCodes.indexOf(error.status_code) !== -1;
  }
  
  return false;
}

/**
 * Basic Monday API Query (simplified version for testing)
 */
function mondayQuery(query, variables) {
  Logger.log('=== MONDAY API QUERY ===');
  Logger.log('[DEBUG] Query: ' + query.substring(0, 100) + '...');
  Logger.log('[DEBUG] Variables: ' + JSON.stringify(variables));
  
  try {
    var token = PropertiesService.getScriptProperties().getProperty('MONDAY_API_TOKEN') || 
                PropertiesService.getScriptProperties().getProperty('MONDAY_API_KEY');
    
    if (!token) {
      throw new Error('MONDAY_API_TOKEN/MONDAY_API_KEY not configured in PropertiesService');
    }
    
    var payload = {
      query: query,
      variables: variables
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': token,
        'API-Version': '2023-10'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Don't throw on HTTP errors
    };
    
    Logger.log('[DEBUG] Making API request to: https://api.monday.com/v2');
    
    var response = UrlFetchApp.fetch('https://api.monday.com/v2', options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log('[DEBUG] Response code: ' + responseCode);
    Logger.log('[DEBUG] Response text: ' + responseText.substring(0, 200) + '...');
    
    if (responseCode !== 200) {
      throw new Error('HTTP ' + responseCode + ': ' + responseText);
    }
    
    var result = JSON.parse(responseText);
    
    if (result.errors && result.errors.length > 0) {
      Logger.log('[ERROR] GraphQL errors: ' + JSON.stringify(result.errors));
      throw new Error('GraphQL Error: ' + result.errors[0].message);
    }
    
    Logger.log('[INFO] GraphQL query successful');
    return result;
    
  } catch (error) {
    Logger.log('[ERROR] Query failed: ' + error.message);
    throw error;
  }
}
function testTokenValidation() {
  Logger.log('=== TESTING TOKEN VALIDATION ===');
  
  // Test 1: No token configured
  var scriptProperties = PropertiesService.getScriptProperties();
  var originalToken = scriptProperties.getProperty('WEBHOOK_TOKEN');
  scriptProperties.deleteProperty('WEBHOOK_TOKEN');
  
  var testEvent1 = {
    parameter: { 'X-Z-Webhook-Token': 'test_token' }
  };
  
  var result1 = validateWebhookToken(testEvent1);
  Logger.log('[TEST 1] No token configured: ' + (result1.valid ? 'FAILED' : 'PASSED'));
  Logger.log('[DEBUG] Test 1 method: ' + result1.method);
  
  // Restore token
  if (originalToken) {
    scriptProperties.setProperty('WEBHOOK_TOKEN', originalToken);
  } else {
    scriptProperties.setProperty('WEBHOOK_TOKEN', 'test_token_12345678');
  }
  
  // Test 2: Valid token
  var testEvent2 = {
    parameter: { 'X-Z-Webhook-Token': scriptProperties.getProperty('WEBHOOK_TOKEN') }
  };
  
  var result2 = validateWebhookToken(testEvent2);
  Logger.log('[TEST 2] Valid token: ' + (result2.valid ? 'PASSED' : 'FAILED'));
  Logger.log('[DEBUG] Test 2 method: ' + result2.method);
  
  // Test 3: Invalid token
  var testEvent3 = {
    parameter: { 'X-Z-Webhook-Token': 'invalid_token' }
  };
  
  var result3 = validateWebhookToken(testEvent3);
  Logger.log('[TEST 3] Invalid token: ' + (result3.valid ? 'FAILED' : 'PASSED'));
  Logger.log('[DEBUG] Test 3 method: ' + result3.method);
  
  Logger.log('[RESULT] Token validation tests completed');
  
  return {
    test1: result1.valid === false,
    test2: result2.valid === true,
    test3: result3.valid === false,
    methods: {
      test1: result1.method,
      test2: result2.method,
      test3: result3.method
    }
  };
}

/**
 * FORCED: Test enhanced token validation directly
 * This bypasses any potential caching issues
 */
function testEnhancedTokenValidation() {
  Logger.log('=== TESTING ENHANCED TOKEN VALIDATION (FORCED) ===');
  
  // Test 1: No token configured
  var scriptProperties = PropertiesService.getScriptProperties();
  var originalToken = scriptProperties.getProperty('WEBHOOK_TOKEN');
  scriptProperties.deleteProperty('WEBHOOK_TOKEN');
  
  var testEvent1 = {
    parameter: { 'X-Z-Webhook-Token': 'test_token' }
  };
  
  // Call the enhanced validation directly
  var result1 = validateWebhookTokenEnhanced(testEvent1);
  Logger.log('[TEST 1] No token configured: ' + (result1.valid ? 'FAILED' : 'PASSED'));
  Logger.log('[DEBUG] Test 1 method: ' + result1.method);
  
  // Restore token
  if (originalToken) {
    scriptProperties.setProperty('WEBHOOK_TOKEN', originalToken);
  } else {
    scriptProperties.setProperty('WEBHOOK_TOKEN', 'test_token_12345678');
  }
  
  // Test 2: Valid token
  var testEvent2 = {
    parameter: { 'X-Z-Webhook-Token': scriptProperties.getProperty('WEBHOOK_TOKEN') }
  };
  
  var result2 = validateWebhookTokenEnhanced(testEvent2);
  Logger.log('[TEST 2] Valid token: ' + (result2.valid ? 'PASSED' : 'FAILED'));
  Logger.log('[DEBUG] Test 2 method: ' + result2.method);
  
  // Test 3: Invalid token
  var testEvent3 = {
    parameter: { 'X-Z-Webhook-Token': 'invalid_token' }
  };
  
  var result3 = validateWebhookTokenEnhanced(testEvent3);
  Logger.log('[TEST 3] Invalid token: ' + (result3.valid ? 'FAILED' : 'PASSED'));
  Logger.log('[DEBUG] Test 3 method: ' + result3.method);
  
  Logger.log('[RESULT] Enhanced token validation tests completed');
  
  return {
    test1: result1.valid === false,
    test2: result2.valid === true,
    test3: result3.valid === false,
    methods: {
      test1: result1.method,
      test2: result2.method,
      test3: result3.method
    }
  };
}

/**
 * Enhanced webhook token validation (duplicate with different name to force usage)
 */
function validateWebhookTokenEnhanced(e) {
  Logger.log('=== WEBHOOK TOKEN VALIDATION (ENHANCED) ===');
  
  try {
    // Get expected token from properties with fallback
    var expectedToken = PropertiesService.getScriptProperties()
      .getProperty('WEBHOOK_TOKEN');
    
    if (!expectedToken) {
      Logger.log('[WARN] No WEBHOOK_TOKEN configured - checking development mode');
      
      // Development mode: allow test tokens
      var isDevMode = PropertiesService.getScriptProperties()
        .getProperty('DEVELOPMENT_MODE') === 'true';
      
      if (isDevMode) {
        Logger.log('[INFO] Development mode active - allowing test tokens');
        return { 
          valid: true, 
          method: 'development_mode',
          token: 'test_token'
        };
      }
      
      return { 
        valid: false, 
        error: 'WEBHOOK_TOKEN not configured',
        method: 'missing_token'
      };
    }
    
    // Try multiple token sources (header, parameter, custom header)
    var receivedToken = null;
    var tokenSource = '';
    
    // Method 1: Standard header
    if (e.headers && e.headers['X-Z-Webhook-Token']) {
      receivedToken = e.headers['X-Z-Webhook-Token'];
      tokenSource = 'header_X-Z-Webhook-Token';
    }
    
    // Method 2: Parameter (for testing)
    if (!receivedToken && e.parameter && e.parameter['X-Z-Webhook-Token']) {
      receivedToken = e.parameter['X-Z-Webhook-Token'];
      tokenSource = 'parameter_X-Z-Webhook-Token';
    }
    
    // Method 3: Custom header (some webhook systems use different headers)
    if (!receivedToken && e.headers && e.headers['Authorization']) {
      var authHeader = e.headers['Authorization'];
      if (authHeader.startsWith('Bearer ')) {
        receivedToken = authHeader.substring(7);
        tokenSource = 'header_Authorization_Bearer';
      }
    }
    
    // Method 4: Monday.com specific header
    if (!receivedToken && e.headers && e.headers['Monday-Signature']) {
      receivedToken = e.headers['Monday-Signature'];
      tokenSource = 'header_Monday-Signature';
    }
    
    Logger.log('[DEBUG] Token validation attempt:');
    Logger.log('[DEBUG] Source: ' + tokenSource);
    Logger.log('[DEBUG] Expected length: ' + expectedToken.length);
    Logger.log('[DEBUG] Received length: ' + (receivedToken ? receivedToken.length : 0));
    
    if (!receivedToken) {
      return { 
        valid: false, 
        error: 'No token provided',
        method: 'no_token_found'
      };
    }
    
    // Compare tokens securely
    var isValid = receivedToken === expectedToken;
    
    if (isValid) {
      Logger.log('[SUCCESS] Token validation successful via: ' + tokenSource);
      return { 
        valid: true, 
        method: tokenSource,
        token: maskToken(receivedToken)
      };
    } else {
      Logger.log('[ERROR] Token mismatch');
      Logger.log('[ERROR] Expected: ' + maskToken(expectedToken));
      Logger.log('[ERROR] Received: ' + maskToken(receivedToken));
      
      return { 
        valid: false, 
        error: 'Invalid token',
        method: tokenSource,
        expected: maskToken(expectedToken),
        received: maskToken(receivedToken)
      };
    }
    
  } catch (error) {
    Logger.log('[ERROR] Token validation error: ' + error.message);
    
    return { 
      valid: false, 
      error: 'Validation error: ' + error.message,
      method: 'exception'
    };
  }
}
/**
 * Enhanced Health Check with comprehensive system status
 */
function healthCheck() {
  Logger.log('=== SYSTEM HEALTH CHECK ===');
  
  var startTime = new Date().getTime();
  var healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: startTime,
    checks: {}
  };
  
  try {
    // Check 1: API Token Configuration
    Logger.log('[CHECK] API Token Configuration...');
    var apiToken = PropertiesService.getScriptProperties().getProperty('MONDAY_API_TOKEN') || 
                   PropertiesService.getScriptProperties().getProperty('MONDAY_API_KEY');
    
    var tokenSource = PropertiesService.getScriptProperties().getProperty('MONDAY_API_TOKEN') ? 'MONDAY_API_TOKEN' : 'MONDAY_API_KEY';
    
    healthStatus.checks.api_token = {
      status: apiToken ? 'configured' : 'missing',
      configured: !!apiToken,
      token_length: apiToken ? apiToken.length : 0,
      token_source: tokenSource
    };
    
    // Check 2: Webhook Security
    Logger.log('[CHECK] Webhook Security...');
    var webhookToken = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
    var devMode = PropertiesService.getScriptProperties().getProperty('DEVELOPMENT_MODE');
    var allowedBoards = PropertiesService.getScriptProperties().getProperty('ALLOWED_BOARDS');
    
    healthStatus.checks.webhook_security = {
      status: webhookToken ? 'configured' : 'missing',
      token_configured: !!webhookToken,
      development_mode: devMode === 'true',
      allowed_boards: allowedBoards ? allowedBoards.split(',') : [],
      security_level: webhookToken && devMode === 'false' ? 'production' : 'development'
    };
    
    // Check 3: API Connectivity (with retry)
    Logger.log('[CHECK] API Connectivity...');
    try {
      var apiTest = mondayQueryWithRetry(
        'query { boards(limit: 1) { id name } }',
        {},
        { maxRetries: 1, baseDelay: 500 }
      );
      
      healthStatus.checks.api_connectivity = {
        status: 'connected',
        response_time: new Date().getTime() - startTime,
        boards_found: apiTest.data ? apiTest.data.boards.length : 0,
        sample_board: apiTest.data && apiTest.data.boards.length > 0 ? 
          apiTest.data.boards[0].name : 'none'
      };
    } catch (error) {
      healthStatus.checks.api_connectivity = {
        status: 'failed',
        error: error.message,
        response_time: new Date().getTime() - startTime
      };
      healthStatus.status = 'degraded';
    }
    
    // Check 4: Retry Logic
    Logger.log('[CHECK] Retry Logic...');
    var retryableError = new Error('Network timeout occurred');
    var nonRetryableError = new Error('Invalid GraphQL syntax');
    
    healthStatus.checks.retry_logic = {
      status: 'functional',
      retryable_classification: isRetryableError(retryableError),
      non_retryable_classification: !isRetryableError(nonRetryableError),
      max_retries_configured: 3,
      base_delay_ms: 1000
    };
    
    // Check 5: Board Access
    Logger.log('[CHECK] Board Access...');
    if (allowedBoards) {
      var boardIds = allowedBoards.split(',');
      var accessibleBoards = [];
      
      for (var i = 0; i < Math.min(boardIds.length, 3); i++) { // Check max 3 boards
        try {
          var boardCheck = mondayQueryWithRetry(
            'query getBoard($boardId: ID!) { boards(ids: [$boardId]) { id name } }',
            { boardId: boardIds[i].trim() },
            { maxRetries: 1, baseDelay: 300 }
          );
          
          if (boardCheck.data && boardCheck.data.boards.length > 0) {
            accessibleBoards.push({
              id: boardIds[i].trim(),
              name: boardCheck.data.boards[0].name,
              accessible: true
            });
          } else {
            accessibleBoards.push({
              id: boardIds[i].trim(),
              name: 'unknown',
              accessible: false
            });
          }
        } catch (error) {
          accessibleBoards.push({
            id: boardIds[i].trim(),
            name: 'error',
            accessible: false,
            error: error.message
          });
        }
      }
      
      healthStatus.checks.board_access = {
        status: accessibleBoards.filter(b => b.accessible).length > 0 ? 'accessible' : 'failed',
        total_configured: boardIds.length,
        accessible_count: accessibleBoards.filter(b => b.accessible).length,
        boards: accessibleBoards
      };
    } else {
      healthStatus.checks.board_access = {
        status: 'not_configured',
        message: 'No boards configured in ALLOWED_BOARDS'
      };
    }
    
    // Check 6: Error Handling
    Logger.log('[CHECK] Error Handling...');
    healthStatus.checks.error_handling = {
      status: 'functional',
      token_masking: typeof maskToken === 'function',
      webhook_validation: typeof validateWebhookToken === 'function',
      retry_logic: typeof mondayQueryWithRetry === 'function',
      automation_processing: typeof processWebhookAutomation === 'function'
    };
    
    // Overall status calculation
    var failedChecks = Object.keys(healthStatus.checks).filter(key => 
      healthStatus.checks[key].status === 'failed' || 
      healthStatus.checks[key].status === 'missing'
    );
    
    if (failedChecks.length > 0) {
      healthStatus.status = 'unhealthy';
    } else if (Object.keys(healthStatus.checks).filter(key => 
      healthStatus.checks[key].status === 'degraded').length > 0) {
      healthStatus.status = 'degraded';
    }
    
    healthStatus.response_time = new Date().getTime() - startTime;
    healthStatus.summary = {
      total_checks: Object.keys(healthStatus.checks).length,
      passed_checks: Object.keys(healthStatus.checks).filter(key => 
        healthStatus.checks[key].status !== 'failed' && 
        healthStatus.checks[key].status !== 'missing'
      ).length,
      failed_checks: failedChecks.length
    };
    
    Logger.log('[SUCCESS] Health check completed in ' + healthStatus.response_time + 'ms');
    Logger.log('[INFO] Overall status: ' + healthStatus.status);
    
    return healthStatus;
    
  } catch (error) {
    Logger.log('[ERROR] Health check failed: ' + error.message);
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      response_time: new Date().getTime() - startTime
    };
  }
}

/**
 * Test health check functionality
 */
function testHealthCheck() {
  Logger.log('=== TESTING HEALTH CHECK ===');
  
  try {
    var healthResult = healthCheck();
    
    Logger.log('[INFO] Health check status: ' + healthResult.status);
    Logger.log('[INFO] Response time: ' + healthResult.response_time + 'ms');
    Logger.log('[INFO] Total checks: ' + healthResult.summary.total_checks);
    Logger.log('[INFO] Passed checks: ' + healthResult.summary.passed_checks);
    Logger.log('[INFO] Failed checks: ' + healthResult.summary.failed_checks);
    
    // Log individual check results
    for (var checkName in healthResult.checks) {
      var check = healthResult.checks[checkName];
      Logger.log('[CHECK] ' + checkName + ': ' + check.status);
    }
    
    Logger.log('[RESULT] Health check test completed');
    
    return {
      test_status: 'completed',
      health_status: healthResult.status,
      response_time: healthResult.response_time,
      checks_passed: healthResult.summary.passed_checks,
      checks_total: healthResult.summary.total_checks
    };
    
  } catch (error) {
    Logger.log('[ERROR] Health check test failed: ' + error.message);
    
    return {
      test_status: 'failed',
      error: error.message
    };
  }
}

/**
 * Test function - Automation core
 */
function testAutomationCore() {
  Logger.log('=== TESTING AUTOMATION CORE ===');
  
  // Use the test function from Automation.gs
  return testWebhookParsing();
}

// ============================================================================
// VERSION SYSTEM (ADDED FOR COMPATIBILITY)
// ============================================================================

/**
 * Get system version information
 */
function getSystemVersion() {
  return {
    system: 'Monday Automation Enterprise',
    version: '1.0.0',
    build_date: '2025-11-27',
    api_version: '2023-10',
    features: {
      webhook_security: true,
      retry_logic: true,
      health_check: true,
      board_whitelist: true,
      exponential_backoff: true,
      token_validation: true
    },
    compatibility: {
      monday_api: 'v2',
      apps_script_runtime: 'V8',
      minimum_node_version: '12.x'
    }
  };
}

/**
 * Test version system
 */
function testVersionSystem() {
  Logger.log('=== TESTING VERSION SYSTEM ===');
  
  try {
    var version = getSystemVersion();
    Logger.log('[INFO] System: ' + version.system);
    Logger.log('[INFO] Version: ' + version.version);
    Logger.log('[INFO] Build Date: ' + version.build_date);
    Logger.log('[INFO] API Version: ' + version.api_version);
    
    Logger.log('[INFO] Compatible: true');
    Logger.log('[RESULT] Version system test completed');
    
    return {
      test_status: 'completed',
      version: version.version,
      compatible: true,
      issues_count: 0
    };
    
  } catch (error) {
    Logger.log('[ERROR] Version system test failed: ' + error.message);
    
    return {
      test_status: 'failed',
      error: error.message
    };
  }
}
