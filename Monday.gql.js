/**
 * Monday.com GraphQL API Functions
 * 
 * This file contains all GraphQL queries and mutations for interacting
 * with the Monday.com API.
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var MONDAY_API_URL = 'https://api.monday.com/v2';
var MAX_RETRIES = 3;
var RETRY_DELAY_MS = 1000; // 1 second initial delay

// ============================================================================
// CORE GRAPHQL FUNCTION
// ============================================================================

/**
 * Monday API Query with Error Handling
 * 
 * @param {String} query - GraphQL query string
 * @param {Object} variables - Variables for GraphQL query
 * @returns {Object} Query results or error
 */
function mondayQuery(query, variables) {
  Logger.log('=== MONDAY API QUERY ===');
  Logger.log('[DEBUG] Query: ' + query.substring(0, 100) + '...');
  Logger.log('[DEBUG] Variables: ' + JSON.stringify(variables));
  
  try {
    var token = PropertiesService.getScriptProperties().getProperty('MONDAY_API_TOKEN');
    
    if (!token) {
      throw new Error('MONDAY_API_TOKEN not configured in PropertiesService');
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
    
    Logger.log('[DEBUG] Making API request to: ' + MONDAY_API_URL);
    
    var response = UrlFetchApp.fetch(MONDAY_API_URL, options);
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
  var maxRetries = options.maxRetries || MAX_RETRIES;
  var baseDelay = options.baseDelay || RETRY_DELAY_MS;
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
 * Enhanced getLinkedItems with retry logic
 */
function getLinkedItemsWithRetry(boardId, itemId, columnId, options) {
  options = options || {};
  
  var query = `
    query getLinkedItems($boardId: ID!, $itemId: ID!, $columnId: String!) {
      boards(ids: [$boardId]) {
        items_page(limit: 1, query_params: {ids: [$itemId]}) {
          items {
            column_values(ids: [$columnId]) {
              value
              text
            }
          }
        }
      }
    }
  `;
  
  return mondayQueryWithRetry(query, {
    boardId: boardId,
    itemId: itemId,
    columnId: columnId
  }, options);
}

/**
 * Enhanced setColumnValue with retry logic
 */
function setColumnValueWithRetry(boardId, itemId, columnId, value, options) {
  options = options || {};
  
  var query = `
    mutation changeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(
        board_id: $boardId,
        item_id: $itemId,
        column_id: $columnId,
        value: $value
      ) {
        id
        column_values(ids: [$columnId]) {
          value
          text
        }
      }
    }
  `;
  
  return mondayQueryWithRetry(query, {
    boardId: boardId,
    itemId: itemId,
    columnId: columnId,
    value: value
  }, options);
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
 * Execute a GraphQL query/mutation on Monday.com API
 * 
 * @param {String} query - GraphQL query string
 * @param {Object} variables - Variables for the query (optional)
 * @returns {Object} Response data or error object
 */
function mondayQuery(query, variables) {
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  if (!apiKey) {
    Logger.log('[ERROR] No MONDAY_API_KEY configured in PropertiesService');
    return {
      data: null,
      errors: ['API key not configured'],
      status: 'error'
    };
  }
  
  var payload = {
    query: query
  };
  
  if (variables) {
    payload.variables = variables;
  }
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': apiKey,
      'API-Version': '2023-10'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Don't throw on HTTP errors
  };
  
  Logger.log('[DEBUG] Monday API Request:');
  Logger.log('[DEBUG] Query: ' + query);
  if (variables) {
    Logger.log('[DEBUG] Variables: ' + JSON.stringify(variables));
  }
  
  try {
    var response = UrlFetchApp.fetch(MONDAY_API_URL, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log('[DEBUG] Response code: ' + responseCode);
    Logger.log('[DEBUG] Response text: ' + responseText);
    
    if (responseCode === 200) {
      var responseData = JSON.parse(responseText);
      
      if (responseData.errors && responseData.errors.length > 0) {
        Logger.log('[ERROR] GraphQL errors: ' + JSON.stringify(responseData.errors));
        return {
          data: responseData.data,
          errors: responseData.errors,
          status: 'graphql_error'
        };
      }
      
      Logger.log('[INFO] GraphQL query successful');
      return {
        data: responseData.data,
        errors: null,
        status: 'success'
      };
      
    } else if (responseCode === 429) {
      Logger.log('[ERROR] Rate limit exceeded (429)');
      return {
        data: null,
        errors: ['Rate limit exceeded'],
        status: 'rate_limit'
      };
      
    } else if (responseCode === 401) {
      Logger.log('[ERROR] Unauthorized (401) - Check API key');
      return {
        data: null,
        errors: ['Unauthorized - Invalid API key'],
        status: 'unauthorized'
      };
      
    } else {
      Logger.log('[ERROR] HTTP error ' + responseCode + ': ' + responseText);
      return {
        data: null,
        errors: ['HTTP error ' + responseCode],
        status: 'http_error'
      };
    }
    
  } catch (error) {
    Logger.log('[ERROR] Exception in mondayQuery: ' + error);
    Logger.log('[ERROR] Stack trace: ' + error.stack);
    
    return {
      data: null,
      errors: [error.toString()],
      status: 'exception'
    };
  }
}

// ============================================================================
// QUERY FUNCTIONS (Read Operations)
// ============================================================================

/**
 * Get linked item IDs from a connect_boards column
 * 
 * @param {Number} boardId - Board ID
 * @param {Number} itemId - Item ID
 * @param {String} columnId - Column ID (connect_boards type)
 * @returns {Array} Array of linked item IDs
 */
function getLinkedItemIds(boardId, itemId, columnId) {
  var query = `
    query getLinkedItems($boardId: ID!, $itemId: ID!, $columnId: String!) {
      boards(ids: [$boardId]) {
        items_page(limit: 1, query_params: {ids: [$itemId]}) {
          items {
            column_values(ids: [$columnId]) {
              value
              text
            }
          }
        }
      }
    }
  `;
  
  var variables = {
    boardId: boardId.toString(),
    itemId: itemId.toString(),
    columnId: columnId
  };
  
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    Logger.log('[ERROR] Failed to get linked items: ' + JSON.stringify(result.errors));
    return [];
  }
  
  try {
    var boards = result.data.boards;
    if (!boards || boards.length === 0) {
      Logger.log('[WARN] No board found with ID: ' + boardId);
      return [];
    }
    
    var items = boards[0].items_page.items;
    if (!items || items.length === 0) {
      Logger.log('[WARN] No item found with ID: ' + itemId);
      return [];
    }
    
    var columnValues = items[0].column_values;
    if (!columnValues || columnValues.length === 0) {
      Logger.log('[WARN] No column values found for column: ' + columnId);
      return [];
    }
    
    var columnValue = columnValues[0];
    if (!columnValue.value) {
      Logger.log('[INFO] No linked items in connect_boards column');
      return [];
    }
    
    // Parse the linked items JSON
    var linkedItems = JSON.parse(columnValue.value);
    var linkedIds = [];
    
    if (linkedItems && linkedItems.linkedPulseIds) {
      linkedIds = linkedItems.linkedPulseIds.map(function(item) {
        return parseInt(item.linkedPulseId);
      });
    }
    
    Logger.log('[INFO] Found ' + linkedIds.length + ' linked items: ' + JSON.stringify(linkedIds));
    return linkedIds;
    
  } catch (error) {
    Logger.log('[ERROR] Failed to parse linked items response: ' + error);
    return [];
  }
}

/**
 * Get item details by ID
 * 
 * @param {Number} itemId - Item ID
 * @returns {Object} Item data
 */
function getItemById(itemId) {
  // TODO: Implement in Sprint 2
  
  Logger.log('[INFO] getItemById() - TO BE IMPLEMENTED (Sprint 2)');
  Logger.log('[DEBUG] itemId: ' + itemId);
  
  return null;
}

/**
 * Get column value from an item
 * 
 * @param {Number} itemId - Item ID
 * @param {String} columnId - Column ID
 * @returns {Object} Column value data
 */
function getColumnValue(itemId, columnId) {
  // TODO: Implement in Sprint 2
  
  Logger.log('[INFO] getColumnValue() - TO BE IMPLEMENTED (Sprint 2)');
  Logger.log('[DEBUG] itemId: ' + itemId + ', columnId: ' + columnId);
  
  return null;
}

// ============================================================================
// MUTATION FUNCTIONS (Write Operations)
// ============================================================================

/**
 * Update a column value on an item
 * 
 * @param {Number} boardId - Board ID
 * @param {Number} itemId - Item ID
 * @param {String} columnId - Column ID
 * @param {Object} value - New value (format depends on column type)
 * @returns {Object} Result of the mutation
 */
function setColumnValue(boardId, itemId, columnId, value) {
  var query = `
    mutation changeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(
        board_id: $boardId,
        item_id: $itemId,
        column_id: $columnId,
        value: $value
      ) {
        id
        column_values(ids: [$columnId]) {
          value
          text
        }
      }
    }
  `;
  
  var variables = {
    boardId: boardId.toString(),
    itemId: itemId.toString(),
    columnId: columnId,
    value: value
  };
  
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    Logger.log('[ERROR] Failed to update column value: ' + JSON.stringify(result.errors));
    return {
      success: false,
      message: 'GraphQL error: ' + (result.errors ? result.errors.join(', ') : 'Unknown error'),
      data: null
    };
  }
  
  try {
    var changeResult = result.data.change_column_value;
    
    if (!changeResult) {
      Logger.log('[ERROR] No result returned from change_column_value mutation');
      return {
        success: false,
        message: 'No result returned from mutation',
        data: null
      };
    }
    
    Logger.log('[INFO] Successfully updated column ' + columnId + ' on item ' + itemId);
    
    return {
      success: true,
      message: 'Column value updated successfully',
      data: changeResult
    };
    
  } catch (error) {
    Logger.log('[ERROR] Failed to parse update response: ' + error);
    return {
      success: false,
      message: 'Failed to parse response: ' + error,
      data: null
    };
  }
}

/**
 * Update status column (simplified version of setColumnValue)
 * 
 * @param {Number} boardId - Board ID
 * @param {Number} itemId - Item ID
 * @param {String} statusColumnId - Status column ID
 * @param {String} statusLabel - Status label (e.g., "Done", "Working on it")
 * @returns {Object} Result of the mutation
 */
function updateStatus(boardId, itemId, statusColumnId, statusLabel) {
  // Status columns use a specific JSON format - need to pass as JSON string
  var statusValue = JSON.stringify({
    label: statusLabel
  });
  
  Logger.log('[INFO] Updating status to "' + statusLabel + '" on item ' + itemId + 
              ' (column: ' + statusColumnId + ')');
  Logger.log('[DEBUG] Status value as JSON string: ' + statusValue);
  
  var result = setColumnValue(boardId, itemId, statusColumnId, statusValue);
  
  if (result.success) {
    Logger.log('[INFO] Status update successful: ' + statusLabel);
  } else {
    Logger.log('[ERROR] Status update failed: ' + result.message);
  }
  
  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse column_values response from Monday API
 * 
 * @param {Array} columnValues - Array of column_value objects
 * @returns {Object} Parsed column values as key-value pairs
 */
function parseColumnValues(columnValues) {
  var parsed = {};
  
  if (!columnValues || !Array.isArray(columnValues)) {
    Logger.log('[WARN] Invalid columnValues provided to parseColumnValues');
    return parsed;
  }
  
  for (var i = 0; i < columnValues.length; i++) {
    var column = columnValues[i];
    var columnId = column.id;
    var value = column.value;
    var text = column.text;
    
    // Store both raw value and text representation
    parsed[columnId] = {
      id: columnId,
      value: value,
      text: text,
      parsed: null
    };
    
    // Try to parse JSON values
    if (value) {
      try {
        parsed[columnId].parsed = JSON.parse(value);
      } catch (error) {
        // If it's not JSON, keep as string
        parsed[columnId].parsed = value;
      }
    }
  }
  
  Logger.log('[DEBUG] Parsed ' + Object.keys(parsed).length + ' column values');
  return parsed;
}

/**
 * Handle API errors and retry logic
 * 
 * @param {Function} apiFunction - Function to retry
 * @param {Array} args - Arguments for the function
 * @param {Number} retries - Number of retries remaining
 * @returns {Object} Result or error
 */
function retryApiCall(apiFunction, args, retries) {
  // TODO: Implement in Sprint 4
  
  Logger.log('[INFO] retryApiCall() - TO BE IMPLEMENTED (Sprint 4)');
  
  return null;
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test Monday API connection
 */
function testMondayConnection() {
  Logger.log('=== TESTING MONDAY API CONNECTION ===');
  
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  if (!apiKey) {
    Logger.log('[ERROR] No MONDAY_API_KEY configured');
    Logger.log('[INFO] Please set MONDAY_API_KEY in PropertiesService');
    return;
  }
  
  Logger.log('[INFO] API Key found (first 10 chars): ' + apiKey.substring(0, 10) + '...');
  
  // Test with a simple query to get user info
  var query = `
    query getUser {
      me {
        id
        name
        email
      }
    }
  `;
  
  var result = mondayQuery(query);
  
  if (result.status === 'success') {
    Logger.log('[SUCCESS] API connection working!');
    Logger.log('[INFO] User: ' + JSON.stringify(result.data.me, null, 2));
  } else {
    Logger.log('[ERROR] API connection failed: ' + JSON.stringify(result.errors));
  }
}

/**
 * Test GraphQL query in Developer Playground first
 * Then implement here after validation
 */
function testGraphQLQuery() {
  Logger.log('=== GRAPHQL QUERY TEST ===');
  Logger.log('[INFO] Use Monday Developer Playground to test queries first');
  Logger.log('[INFO] URL: https://your-workspace.monday.com/developers/graphql');
  Logger.log('[INFO] Basic query structure:');
  Logger.log(`
  query {
    boards(ids: [BOARD_ID]) {
      name
      items_page(limit: 10) {
        items {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  }`);
}

/**
 * Test linked items functionality
 */
function testGetLinkedItems() {
  Logger.log('=== TESTING GET LINKED ITEMS ===');
  
  // These should be replaced with actual IDs from your boards
  var testBoardId = 123456; // Replace with real board ID
  var testItemId = 789012;  // Replace with real item ID
  var testColumnId = 'connect_boards'; // Replace with real column ID
  
  Logger.log('[INFO] Testing with sample IDs (replace with real ones):');
  Logger.log('[DEBUG] Board ID: ' + testBoardId);
  Logger.log('[DEBUG] Item ID: ' + testItemId);
  Logger.log('[DEBUG] Column ID: ' + testColumnId);
  
  var linkedIds = getLinkedItemIds(testBoardId, testItemId, testColumnId);
  
  Logger.log('[RESULT] Linked items found: ' + linkedIds.length);
  if (linkedIds.length > 0) {
    Logger.log('[RESULT] Linked item IDs: ' + JSON.stringify(linkedIds));
  }
}

/**
 * Test status update functionality
 */
function testStatusUpdate() {
  Logger.log('=== TESTING STATUS UPDATE ===');
  
  // These should be replaced with actual IDs from your boards
  var testBoardId = 123456;     // Replace with real board ID
  var testItemId = 789012;      // Replace with real item ID
  var testStatusColumnId = 'status'; // Replace with real status column ID
  var testStatus = 'Working on it';
  
  Logger.log('[INFO] Testing status update (replace with real IDs):');
  Logger.log('[DEBUG] Board ID: ' + testBoardId);
  Logger.log('[DEBUG] Item ID: ' + testItemId);
  Logger.log('[DEBUG] Column ID: ' + testStatusColumnId);
  Logger.log('[DEBUG] New Status: ' + testStatus);
  
  var result = updateStatus(testBoardId, testItemId, testStatusColumnId, testStatus);
  
  if (result.success) {
    Logger.log('[SUCCESS] Status update test completed');
  } else {
    Logger.log('[ERROR] Status update test failed: ' + result.message);
  }
}
