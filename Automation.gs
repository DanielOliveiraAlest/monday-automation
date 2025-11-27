/**
 * Monday Automation Core - Webhook Processing
 * 
 * This file contains the core automation logic for processing Monday.com webhooks
 * and implementing the status synchronization between connected boards.
 * 
 * @version 1.0.0
 */

// ============================================================================
// WEBHOOK PAYLOAD PARSING
// ============================================================================

/**
 * Parse and validate Monday.com webhook payload
 * 
 * @param {Object} payload - Raw webhook payload from Monday.com
 * @returns {Object} Parsed webhook data or error object
 */
function parseWebhookPayload(payload) {
  Logger.log('=== WEBHOOK PAYLOAD PARSING ===');
  Logger.log('[DEBUG] Raw payload type: ' + typeof payload);
  
  try {
    // Handle different payload formats
    var webhookData;
    
    if (typeof payload === 'string') {
      Logger.log('[DEBUG] Parsing string payload...');
      webhookData = JSON.parse(payload);
    } else if (typeof payload === 'object') {
      Logger.log('[DEBUG] Using object payload directly...');
      webhookData = payload;
    } else {
      throw new Error('Invalid payload type: ' + typeof payload);
    }
    
    Logger.log('[DEBUG] Webhook data keys: ' + Object.keys(webhookData).join(', '));
    
    // Validate required webhook fields
    var requiredFields = ['event', 'triggerTime'];
    for (var i = 0; i < requiredFields.length; i++) {
      var field = requiredFields[i];
      if (!webhookData[field]) {
        throw new Error('Missing required webhook field: ' + field);
      }
    }
    
    Logger.log('[INFO] Webhook payload validated successfully');
    Logger.log('[INFO] Event type: ' + webhookData.event.type);
    Logger.log('[INFO] Trigger time: ' + webhookData.triggerTime);
    
    return {
      success: true,
      data: webhookData,
      errors: null
    };
    
  } catch (error) {
    Logger.log('[ERROR] Failed to parse webhook payload: ' + error.message);
    
    return {
      success: false,
      data: null,
      errors: [error.message]
    };
  }
}

/**
 * Extract board, item, and column information from webhook event
 * 
 * @param {Object} webhookData - Parsed webhook data
 * @returns {Object} Extracted event information or error
 */
function extractEventInfo(webhookData) {
  Logger.log('=== EXTRACTING EVENT INFO ===');
  
  try {
    if (!webhookData || !webhookData.event) {
      throw new Error('No event data found in webhook');
    }
    
    var event = webhookData.event;
    Logger.log('[DEBUG] Event type: ' + event.type);
    
    // Extract different event types - allow unknown types to pass through
    var eventInfo;
    
    try {
      switch (event.type) {
        case 'create_column':
          eventInfo = extractCreateColumnEvent(event);
          break;
          
        case 'create_item':
          eventInfo = extractCreateItemEvent(event);
          break;
          
        case 'update_column_value':
          eventInfo = extractUpdateColumnEvent(event);
          break;
          
        case 'update_name':
        case 'update_person':
        case 'update_date':
          // Handle other update events
          eventInfo = extractGenericUpdateEvent(event);
          break;
          
        default:
          // For unknown events, create a generic event info
          Logger.log('[INFO] Unknown event type, creating generic event info: ' + event.type);
          eventInfo = {
            eventType: event.type,
            boardId: event.boardId,
            itemId: event.pulseId,
            columnId: event.columnId || null,
            changeType: event.changeType || null,
            oldValue: event.previousValue || null,
            newValue: event.changeValue || null,
            columnType: event.columnType || null
          };
      }
    } catch (extractionError) {
      Logger.log('[WARN] Error extracting specific event info, using generic: ' + extractionError.message);
      // Fallback to generic event info
      eventInfo = {
        eventType: event.type,
        boardId: event.boardId,
        itemId: event.pulseId,
        columnId: event.columnId || null,
        changeType: event.changeType || null,
        oldValue: event.previousValue || null,
        newValue: event.changeValue || null,
        columnType: event.columnType || null
      };
    }
    
    Logger.log('[INFO] Event info extracted successfully');
    Logger.log('[INFO] Board ID: ' + eventInfo.boardId);
    Logger.log('[INFO] Item ID: ' + eventInfo.itemId);
    Logger.log('[INFO] Column ID: ' + (eventInfo.columnId || 'N/A'));
    
    return {
      success: true,
      data: eventInfo,
      errors: null
    };
    
  } catch (error) {
    Logger.log('[ERROR] Failed to extract event info: ' + error.message);
    
    return {
      success: false,
      data: null,
      errors: [error.message]
    };
  }
}

/**
 * Extract information from create_column event
 */
function extractCreateColumnEvent(event) {
  return {
    eventType: 'create_column',
    boardId: event.boardId,
    columnId: event.columnId,
    itemId: null,
    columnType: event.columnType,
    columnTitle: event.columnTitle
  };
}

/**
 * Extract information from create_item event
 */
function extractCreateItemEvent(event) {
  return {
    eventType: 'create_item',
    boardId: event.boardId,
    itemId: event.pulseId, // Monday uses "pulseId" for items
    columnId: null,
    itemName: event.pulseName
  };
}

/**
 * Extract information from update_column_value event (most important for our automation)
 */
function extractUpdateColumnEvent(event) {
  var changeInfo = {};
  
  // Parse the changeValue field (contains the new value)
  if (event.changeValue) {
    try {
      changeInfo = JSON.parse(event.changeValue);
    } catch (e) {
      Logger.log('[WARN] Could not parse changeValue as JSON: ' + event.changeValue);
      changeInfo = { value: event.changeValue };
    }
  }
  
  return {
    eventType: 'update_column_value',
    boardId: event.boardId,
    itemId: event.pulseId,
    columnId: event.columnId,
    changeType: event.changeType,
    oldValue: event.previousValue,
    newValue: changeInfo,
    columnType: event.columnType
  };
}

/**
 * Extract information from generic update events
 */
function extractGenericUpdateEvent(event) {
  return {
    eventType: event.type,
    boardId: event.boardId,
    itemId: event.pulseId,
    columnId: event.columnId || null,
    changeType: event.changeType,
    oldValue: event.previousValue,
    newValue: event.changeValue
  };
}

// ============================================================================
// AUTOMATION LOGIC
// ============================================================================

/**
 * Enhanced error handling for webhook processing
 */
function handleWebhookErrors(error, context) {
  Logger.log('=== WEBHOOK ERROR HANDLING ===');
  Logger.log('[ERROR] Error in ' + context + ': ' + error.message);
  Logger.log('[ERROR] Stack trace: ' + error.stack);
  
  var errorResponse = {
    success: false,
    error: error.message,
    context: context,
    timestamp: new Date().toISOString(),
    retryable: isRetryableError(error)
  };
  
  // Log different error levels
  if (errorResponse.retryable) {
    Logger.log('[WARN] Retryable error detected: ' + error.message);
  } else {
    Logger.log('[ERROR] Non-retryable error detected: ' + error.message);
  }
  
  return errorResponse;
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error) {
  var retryableErrors = [
    'Network error',
    'Timeout',
    'Rate limit',
    'Service unavailable',
    'Internal server error'
  ];
  
  var errorMessage = error.message.toLowerCase();
  
  for (var i = 0; i < retryableErrors.length; i++) {
    if (errorMessage.indexOf(retryableErrors[i].toLowerCase()) !== -1) {
      return true;
    }
  }
  
  // GraphQL errors that might be retryable
  if (errorMessage.indexOf('graphql') !== -1) {
    // Check for specific GraphQL errors
    if (errorMessage.indexOf('rate limit') !== -1 || 
        errorMessage.indexOf('timeout') !== -1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Enhanced processWebhookAutomation with better error handling
 */
function processWebhookAutomation(payload) {
  Logger.log('=== MONDAY AUTOMATION PROCESSING ===');
  
  try {
    // Step 1: Parse webhook payload
    var parseResult = parseWebhookPayload(payload);
    if (!parseResult.success) {
      throw new Error('Webhook parsing failed: ' + parseResult.errors.join(', '));
    }
    
    // Step 2: Extract event information
    var eventResult = extractEventInfo(parseResult.data);
    if (!eventResult.success) {
      throw new Error('Event extraction failed: ' + eventResult.errors.join(', '));
    }
    
    var eventInfo = eventResult.data;
    
    // Step 3: Process based on event type
    var actionResult;
    
    try {
      switch (eventInfo.eventType) {
        case 'update_column_value':
          actionResult = processStatusUpdate(eventInfo);
          break;
          
        case 'create_item':
          actionResult = processItemCreation(eventInfo);
          break;
          
        default:
          Logger.log('[INFO] Ignoring event type: ' + eventInfo.eventType);
          actionResult = { success: true, action: 'ignored', reason: 'Unsupported event type' };
      }
    } catch (processingError) {
      // Handle processing-specific errors
      Logger.log('[ERROR] Processing error for event type ' + eventInfo.eventType + ': ' + processingError.message);
      actionResult = {
        success: false,
        action: 'processing_failed',
        error: processingError.message,
        eventType: eventInfo.eventType
      };
    }
    
    Logger.log('[INFO] Automation processing completed');
    Logger.log('[INFO] Action result: ' + actionResult.action);
    
    return {
      success: true,
      eventInfo: eventInfo,
      actionResult: actionResult,
      errors: null
    };
    
  } catch (error) {
    // Use enhanced error handling
    var errorInfo = handleWebhookErrors(error, 'processWebhookAutomation');
    
    return {
      success: false,
      eventInfo: null,
      actionResult: null,
      errors: [errorInfo]
    };
  }
}

/**
 * Process status update events (core automation logic)
 */
function processStatusUpdate(eventInfo) {
  Logger.log('=== PROCESSING STATUS UPDATE ===');
  
  try {
    // Check if this is a status column update
    if (eventInfo.columnType !== 'color' && eventInfo.columnType !== 'status') { // Status columns have type 'color' or 'status'
      Logger.log('[INFO] Not a status column update, ignoring (type: ' + eventInfo.columnType + ')');
      return { success: true, action: 'ignored', reason: 'Not a status column' };
    }
    
    Logger.log('[INFO] Processing status update on item ' + eventInfo.itemId);
    Logger.log('[INFO] Board ID: ' + eventInfo.boardId);
    Logger.log('[INFO] Column ID: ' + eventInfo.columnId);
    Logger.log('[INFO] New status: ' + JSON.stringify(eventInfo.newValue));
    
    // Convert IDs to integers for our GraphQL functions
    var boardId = parseInt(eventInfo.boardId);
    var itemId = parseInt(eventInfo.itemId);
    var columnId = eventInfo.columnId;
    
    // Extract status label from the new value
    var statusLabel = extractStatusLabel(eventInfo.newValue);
    if (!statusLabel) {
      throw new Error('Could not extract status label from new value');
    }
    
    Logger.log('[INFO] Extracted status label: ' + statusLabel);
    
    // TODO: Implement the actual automation logic here
    // 1. Find connected items
    // 2. Update their status
    // 3. Log the action
    
    Logger.log('[INFO] Starting status synchronization logic...');
    
    // Step 1: Find connected items
    var connectedItems = findConnectedItems(boardId, itemId);
    
    if (connectedItems.length === 0) {
      Logger.log('[INFO] No connected items found, automation complete');
      return {
        success: true,
        action: 'status_update_processed',
        boardId: boardId,
        itemId: itemId,
        columnId: columnId,
        statusLabel: statusLabel,
        connectedItems: [],
        syncResult: 'no_connections'
      };
    }
    
    Logger.log('[INFO] Found ' + connectedItems.length + ' connected items');
    
    // Step 2: Update status of connected items
    var syncResults = updateConnectedItemsStatus(connectedItems, statusLabel);
    
    // Step 3: Return results
    return {
      success: true,
      action: 'status_update_processed',
      boardId: boardId,
      itemId: itemId,
      columnId: columnId,
      statusLabel: statusLabel,
      connectedItems: connectedItems,
      syncResults: syncResults,
      syncResult: 'synchronized'
    };
    
  } catch (error) {
    Logger.log('[ERROR] Failed to process status update: ' + error.message);
    
    return {
      success: false,
      action: 'status_update_failed',
      error: error.message
    };
  }
}

/**
 * Find all items connected to the specified item
 */
function findConnectedItems(boardId, itemId) {
  Logger.log('=== FINDING CONNECTED ITEMS ===');
  Logger.log('[INFO] Searching for items connected to item ' + itemId + ' on board ' + boardId);
  
  try {
    // First, get the board structure to find connect_boards columns
    var boardStructure = getBoardColumns(boardId);
    var connectColumns = findConnectColumns(boardStructure);
    
    if (connectColumns.length === 0) {
      Logger.log('[INFO] No connect_boards columns found on board ' + boardId);
      return [];
    }
    
    Logger.log('[INFO] Found ' + connectColumns.length + ' connect_boards columns');
    
    // Search for connected items in each connect column
    var allConnectedItems = [];
    
    for (var i = 0; i < connectColumns.length; i++) {
      var columnId = connectColumns[i];
      Logger.log('[DEBUG] Checking column: ' + columnId);
      
      var connectedIds = getLinkedItemIds(boardId, itemId, columnId);
      
      if (connectedIds.length > 0) {
        Logger.log('[INFO] Found ' + connectedIds.length + ' connected items in column ' + columnId);
        
        for (var j = 0; j < connectedIds.length; j++) {
          allConnectedItems.push({
            itemId: connectedIds[j],
            sourceColumnId: columnId,
            sourceBoardId: boardId,
            targetBoardId: findTargetBoardId(boardId, columnId) // Encontra o board destino
          });
        }
      }
    }
    
    Logger.log('[INFO] Total connected items found: ' + allConnectedItems.length);
    return allConnectedItems;
    
  } catch (error) {
    Logger.log('[ERROR] Failed to find connected items: ' + error.message);
    return [];
  }
}

/**
 * Get board columns structure
 */
function getBoardColumns(boardId) {
  var query = `
    query getBoardColumns($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns {
          id
          title
          type
        }
      }
    }
  `;
  
  var variables = { boardId: boardId.toString() };
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    throw new Error('Failed to get board columns: ' + JSON.stringify(result.errors));
  }
  
  return result.data.boards[0].columns;
}

/**
 * Find all connect_boards columns in board structure
 */
function findConnectColumns(columns) {
  var connectColumns = [];
  
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    
    // Connect boards columns have type 'board_relation'
    if (column.type === 'board_relation') {
      connectColumns.push(column.id);
      Logger.log('[DEBUG] Found connect_boards column: ' + column.id + ' (' + column.title + ')');
    }
  }
  
  return connectColumns;
}

/**
 * Find the target board ID for a connected board column
 */
function findTargetBoardId(sourceBoardId, connectColumnId) {
  Logger.log('[DEBUG] Finding target board for source board ' + sourceBoardId + ' column ' + connectColumnId);
  
  // Para nosso caso específico, sabemos que:
  // Board Origem: 18390046494 -> Board Destino: 18390046725
  // Se precisar de mais flexibilidade, podemos buscar na API
  
  var boardMappings = {
    '18390046494': '18390046725', // Origem -> Destino
    '18390046725': '18390046494'  // Destino -> Origem (se for bidirecional)
  };
  
  var targetBoardId = boardMappings[sourceBoardId.toString()];
  
  if (targetBoardId) {
    Logger.log('[DEBUG] Target board found: ' + targetBoardId);
    return parseInt(targetBoardId);
  }
  
  Logger.log('[WARN] No target board mapping found for ' + sourceBoardId);
  return sourceBoardId; // Fallback para o mesmo board
}

/**
 * Update status of all connected items
 */
function updateConnectedItemsStatus(connectedItems, statusLabel) {
  Logger.log('=== UPDATING CONNECTED ITEMS STATUS ===');
  Logger.log('[INFO] Updating ' + connectedItems.length + ' items to status: ' + statusLabel);
  
  var results = [];
  var successCount = 0;
  var errorCount = 0;
  
  for (var i = 0; i < connectedItems.length; i++) {
    var item = connectedItems[i];
    var targetBoardId = item.targetBoardId || item.sourceBoardId;
    
    Logger.log('[DEBUG] Updating item ' + item.itemId + ' on board ' + targetBoardId);
    
    try {
      // Get the status column of the target board
      var statusColumnId = findStatusColumn(targetBoardId);
      
      if (!statusColumnId) {
        throw new Error('No status column found on board ' + targetBoardId);
      }
      
      // Update the status on the TARGET board
      var updateResult = updateStatus(targetBoardId, item.itemId, statusColumnId, statusLabel);
      
      if (updateResult.success) {
        Logger.log('[SUCCESS] Updated item ' + item.itemId + ' to status: ' + statusLabel + ' on board ' + targetBoardId);
        successCount++;
        
        results.push({
          itemId: item.itemId,
          sourceBoardId: item.sourceBoardId,
          targetBoardId: targetBoardId,
          status: 'success',
          newStatus: statusLabel
        });
      } else {
        throw new Error(updateResult.message || 'Update failed');
      }
      
    } catch (error) {
      Logger.log('[ERROR] Failed to update item ' + item.itemId + ': ' + error.message);
      errorCount++;
      
      results.push({
        itemId: item.itemId,
        sourceBoardId: item.sourceBoardId,
        targetBoardId: targetBoardId,
        status: 'error',
        error: error.message
      });
    }
  }
  
  Logger.log('[INFO] Status update completed: ' + successCount + ' success, ' + errorCount + ' errors');
  
  return {
    totalItems: connectedItems.length,
    successCount: successCount,
    errorCount: errorCount,
    results: results
  };
}

/**
 * Find the status column in a board
 */
function findStatusColumn(boardId) {
  Logger.log('[DEBUG] Finding status column on board ' + boardId);
  
  var columns = getBoardColumns(boardId);
  
  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    
    // Status columns can have type 'color' or 'status'
    if (column.type === 'color' || column.type === 'status') {
      Logger.log('[DEBUG] Found status column: ' + column.id + ' (' + column.title + ') type: ' + column.type);
      return column.id;
    }
  }
  
  Logger.log('[WARN] No status column found on board ' + boardId);
  return null;
}

/**
 * Extract status label from Monday.com column value
 */
function extractStatusLabel(newValue) {
  Logger.log('[DEBUG] Extracting status label from: ' + JSON.stringify(newValue));
  
  if (!newValue) {
    return null;
  }
  
  // Handle different formats of status values
  if (typeof newValue === 'string') {
    try {
      var parsed = JSON.parse(newValue);
      return parsed.label || parsed.text || null;
    } catch (e) {
      // If it's not JSON, return as-is
      return newValue;
    }
  }
  
  if (typeof newValue === 'object') {
    return newValue.label || newValue.text || null;
  }
  
  return null;
}

/**
 * Process item creation events
 */
function processItemCreation(eventInfo) {
  Logger.log('=== PROCESSING ITEM CREATION ===');
  
  Logger.log('[INFO] New item created: ' + eventInfo.itemName);
  Logger.log('[INFO] Item ID: ' + eventInfo.itemId);
  Logger.log('[INFO] Board ID: ' + eventInfo.boardId);
  
  // TODO: Implement item creation automation if needed
  
  return {
    success: true,
    action: 'item_creation_processed',
    itemName: eventInfo.itemName,
    itemId: eventInfo.itemId
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test error handling with invalid payload
 */
function testErrorHandling() {
  Logger.log('=== TESTING ERROR HANDLING ===');
  
  // Test 1: Invalid JSON payload
  var invalidPayload = "invalid json string";
  var result1 = processWebhookAutomation(invalidPayload);
  Logger.log('[TEST 1] Invalid JSON: ' + (result1.success ? 'FAILED' : 'PASSED'));
  
  // Test 2: Missing event in payload
  var noEventPayload = { triggerTime: "2025-01-27T10:30:00.000Z" };
  var result2 = processWebhookAutomation(noEventPayload);
  Logger.log('[TEST 2] Missing event: ' + (result2.success ? 'FAILED' : 'PASSED'));
  
  // Test 3: Valid payload but unsupported event type
  var unsupportedEventPayload = {
    event: {
      type: 'unsupported_event',
      boardId: '123456',
      pulseId: '789012'
    },
    triggerTime: "2025-01-27T10:30:00.000Z"
  };
  var result3 = processWebhookAutomation(unsupportedEventPayload);
  Logger.log('[TEST 3] Unsupported event: ' + (result3.success ? 'PASSED' : 'FAILED'));
  
  Logger.log('[RESULT] Error handling tests completed');
  
  return {
    test1: result1.success === false,
    test2: result2.success === false,
    test3: result3.success === true
  };
}

/**
 * Test webhook payload parsing with sample data
 */
function testWebhookParsing() {
  Logger.log('=== TESTING WEBHOOK PARSING ===');
  
  // Sample webhook payload (similar to what Monday.com sends)
  var samplePayload = {
    event: {
      type: "update_column_value",
      boardId: "18390046494",
      pulseId: "10644299171",
      columnId: "status",
      columnType: "color",
      changeType: "updated",
      changeValue: "{\"label\":\"Em progresso\"}",  // Status em português
      previousValue: "{\"label\":\"Feito\"}"
    },
    triggerTime: "2025-01-27T10:30:00.000Z"
  };
  
  var result = processWebhookAutomation(samplePayload);
  
  Logger.log('[RESULT] Processing success: ' + result.success);
  if (result.success) {
    Logger.log('[RESULT] Event type: ' + result.eventInfo.eventType);
    Logger.log('[RESULT] Action: ' + result.actionResult.action);
  } else {
    Logger.log('[ERROR] Processing failed: ' + result.errors.join(', '));
  }
  
  return result;
}
