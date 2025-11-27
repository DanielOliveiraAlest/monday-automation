/**
 * Secrets and Configuration Management
 * 
 * This file handles all sensitive configuration using Google Apps Script
 * PropertiesService. Never hardcode secrets in your code!
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION SETUP
// ============================================================================

/**
 * Initialize all required script properties
 * Run this function ONCE to set up your secrets
 * 
 * IMPORTANT: After running this, delete your tokens from this file!
 */
function setupSecrets() {
  Logger.log('=== SETTING UP SECRETS ===');
  
  var properties = PropertiesService.getScriptProperties();
  
  // TODO: Replace these values with your actual credentials
  // Then run this function ONCE, then delete the values from this file
  
  properties.setProperties({
    // Monday.com API Key
    // Get from: Monday.com → Avatar → Developers → My Access Tokens
    'MONDAY_API_KEY': 'YOUR_MONDAY_API_KEY_HERE',
    
    // Webhook Security Token
    // Generate a secure random string (use a password generator)
    'WEBHOOK_TOKEN': 'YOUR_SECURE_WEBHOOK_TOKEN_HERE',
    
    // Allowed Board IDs (comma-separated)
    // Example: '123456,789012,345678'
    'ALLOWED_BOARDS': 'YOUR_BOARD_IDS_HERE'
  });
  
  Logger.log('[SUCCESS] Properties configured!');
  Logger.log('[IMPORTANT] Now delete the tokens from this file!');
  
  // Verify setup
  listAllProperties();
}

// ============================================================================
// GETTER FUNCTIONS
// ============================================================================

/**
 * Get Monday API Key
 * 
 * @returns {String} API Key
 */
function getMondayApiKey() {
  var key = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  if (!key) {
    throw new Error('MONDAY_API_KEY not configured. Run setupSecrets() first.');
  }
  
  return key;
}

/**
 * Get Webhook Token
 * 
 * @returns {String} Webhook token
 */
function getWebhookToken() {
  var token = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_TOKEN');
  
  if (!token) {
    Logger.log('[WARN] WEBHOOK_TOKEN not configured. Security is disabled!');
    return null;
  }
  
  return token;
}

/**
 * Get Allowed Boards list
 * 
 * @returns {Array} Array of board IDs (as integers)
 */
function getAllowedBoards() {
  var boards = PropertiesService.getScriptProperties()
    .getProperty('ALLOWED_BOARDS');
  
  if (!boards) {
    Logger.log('[WARN] ALLOWED_BOARDS not configured. All boards allowed!');
    return null;
  }
  
  return boards.split(',').map(function(id) {
    return parseInt(id.trim());
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * List all configured properties (without revealing values)
 */
function listAllProperties() {
  Logger.log('=== CONFIGURED PROPERTIES ===');
  
  var properties = PropertiesService.getScriptProperties().getProperties();
  
  for (var key in properties) {
    var value = properties[key];
    var displayValue;
    
    if (key === 'MONDAY_API_KEY') {
      displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    } else if (key === 'WEBHOOK_TOKEN') {
      displayValue = value.substring(0, 5) + '...' + value.substring(value.length - 3);
    } else {
      displayValue = value;
    }
    
    Logger.log('[' + key + '] = ' + displayValue);
  }
}

/**
 * Verify all required properties are set
 * 
 * @returns {Boolean} True if all required properties exist
 */
function verifyConfiguration() {
  Logger.log('=== VERIFYING CONFIGURATION ===');
  
  var required = ['MONDAY_API_KEY', 'WEBHOOK_TOKEN', 'ALLOWED_BOARDS'];
  var properties = PropertiesService.getScriptProperties();
  var allSet = true;
  
  required.forEach(function(key) {
    var value = properties.getProperty(key);
    var status = value ? '✅ SET' : '❌ MISSING';
    Logger.log('[' + key + '] ' + status);
    
    if (!value) {
      allSet = false;
    }
  });
  
  if (allSet) {
    Logger.log('[SUCCESS] All required properties are configured!');
  } else {
    Logger.log('[ERROR] Some properties are missing. Run setupSecrets() first.');
  }
  
  return allSet;
}

/**
 * Clear all properties (use with caution!)
 */
function clearAllProperties() {
  Logger.log('=== CLEARING ALL PROPERTIES ===');
  
  var confirm = Browser.msgBox(
    'Clear All Properties?',
    'This will delete ALL configured secrets. Are you sure?',
    Browser.Buttons.YES_NO
  );
  
  if (confirm === 'yes') {
    PropertiesService.getScriptProperties().deleteAllProperties();
    Logger.log('[SUCCESS] All properties cleared');
  } else {
    Logger.log('[CANCELLED] Properties not cleared');
  }
}

/**
 * Update a single property
 * 
 * @param {String} key - Property key
 * @param {String} value - New value
 */
function updateProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
  Logger.log('[SUCCESS] Property [' + key + '] updated');
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test configuration
 */
function testConfiguration() {
  Logger.log('=== TESTING CONFIGURATION ===');
  
  try {
    var apiKey = getMondayApiKey();
    Logger.log('✅ Monday API Key: ' + apiKey.substring(0, 10) + '...');
  } catch (e) {
    Logger.log('❌ Monday API Key: ' + e.message);
  }
  
  try {
    var webhookToken = getWebhookToken();
    Logger.log('✅ Webhook Token: ' + (webhookToken ? webhookToken.substring(0, 5) + '...' : 'NOT SET'));
  } catch (e) {
    Logger.log('❌ Webhook Token: ' + e.message);
  }
  
  try {
    var boards = getAllowedBoards();
    Logger.log('✅ Allowed Boards: ' + (boards ? boards.join(', ') : 'ALL ALLOWED'));
  } catch (e) {
    Logger.log('❌ Allowed Boards: ' + e.message);
  }
  
  verifyConfiguration();
}

// ============================================================================
// INSTRUCTIONS
// ============================================================================

/**
 * HOW TO USE THIS FILE:
 * 
 * 1. FIRST TIME SETUP:
 *    - Edit setupSecrets() function with your actual tokens
 *    - Run setupSecrets() from the Apps Script editor
 *    - Delete your tokens from this file after running
 * 
 * 2. VERIFY SETUP:
 *    - Run verifyConfiguration() to check all properties are set
 *    - Run testConfiguration() to test property access
 * 
 * 3. IN YOUR CODE:
 *    - Use getMondayApiKey() to get the API key
 *    - Use getWebhookToken() to get the webhook token
 *    - Use getAllowedBoards() to get the board whitelist
 * 
 * 4. UPDATING VALUES:
 *    - Use updateProperty(key, value) to update a single value
 *    - Or use the Apps Script UI: Project Settings → Script properties
 * 
 * 5. RESET (CAUTION):
 *    - Run clearAllProperties() to delete all (requires confirmation)
 */
