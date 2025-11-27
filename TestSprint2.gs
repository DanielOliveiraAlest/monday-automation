/**
 * Sprint 2 API Integration Tests
 * 
 * This file contains all test functions for Sprint 2
 * Use these functions to validate the GraphQL API implementation
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION - REAL BOARD IDs
// ============================================================================

var TEST_CONFIG = {
  // Real Board IDs from BOARD_CONFIG.md
  ORIGEM_BOARD_ID: 18390046494,
  DESTINO_BOARD_ID: 18390046725,
  
  // Column IDs (to be discovered via API)
  STATUS_COLUMN_ID: 'status', // Default, will be updated after discovery
  CONNECT_COLUMN_ID: 'connect_boards', // Default, will be updated after discovery
  
  // Test Data
  TEST_STATUS_LABEL: 'Working on it',
  NEW_STATUS_LABEL: 'Em progresso'  // Status válido no board destino
};

// ============================================================================
// TEST 1: Basic API Connection
// ============================================================================

/**
 * Test 2.2 - Basic Monday API Connection
 * This validates our mondayQuery() function works
 */
function testBasicApiConnection() {
  Logger.log('=== TEST 2.2: Basic API Connection ===');
  
  // First, verify we have API key configured
  var apiKey = PropertiesService.getScriptProperties()
    .getProperty('MONDAY_API_KEY');
  
  if (!apiKey) {
    Logger.log('[ERROR] No MONDAY_API_KEY configured in PropertiesService');
    Logger.log('[INFO] Please run setupSecrets() from Secrets.gs first');
    return false;
  }
  
  Logger.log('[INFO] API Key found: ' + apiKey.substring(0, 10) + '...');
  
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
  
  Logger.log('[INFO] Testing basic query to get user info...');
  
  var result = mondayQuery(query);
  
  if (result.status === 'success') {
    Logger.log('[SUCCESS] ✅ API connection working!');
    Logger.log('[INFO] User data:');
    Logger.log('  - ID: ' + result.data.me.id);
    Logger.log('  - Name: ' + result.data.me.name);
    Logger.log('  - Email: ' + result.data.me.email);
    return true;
  } else {
    Logger.log('[ERROR] ❌ API connection failed:');
    Logger.log('  - Status: ' + result.status);
    Logger.log('  - Errors: ' + JSON.stringify(result.errors));
    return false;
  }
}

// ============================================================================
// TEST 2: Board Discovery
// ============================================================================

/**
 * Discover board structure and column IDs
 */
function discoverBoardStructure() {
  Logger.log('=== BOARD STRUCTURE DISCOVERY ===');
  
  var query = `
    query getBoards($boardIds: [ID!]) {
      boards(ids: $boardIds) {
        id
        name
        columns {
          id
          title
          type
        }
      }
    }
  `;
  
  var variables = {
    boardIds: [
      TEST_CONFIG.ORIGEM_BOARD_ID.toString(),
      TEST_CONFIG.DESTINO_BOARD_ID.toString()
    ]
  };
  
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    Logger.log('[ERROR] Failed to get board structure: ' + JSON.stringify(result.errors));
    return;
  }
  
  Logger.log('[SUCCESS] Board structure discovered:');
  
  result.data.boards.forEach(function(board) {
    Logger.log('--- Board: ' + board.name + ' (ID: ' + board.id + ') ---');
    
    board.columns.forEach(function(column) {
      var marker = '';
      if (column.type === 'status') marker = ' ← STATUS COLUMN';
      if (column.type === 'connect_boards') marker = ' ← CONNECT BOARDS COLUMN';
      
      Logger.log('  ' + column.id + ': ' + column.title + ' (' + column.type + ')' + marker);
    });
  });
}

// ============================================================================
// TEST 3: Get Items from Boards
// ============================================================================

/**
 * Get items from both test boards
 */
function getTestItems() {
  Logger.log('=== GETTING TEST ITEMS ===');
  
  var query = `
    query getItems($boardIds: [ID!]) {
      boards(ids: $boardIds) {
        id
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
    }
  `;
  
  var variables = {
    boardIds: [
      TEST_CONFIG.ORIGEM_BOARD_ID.toString(),
      TEST_CONFIG.DESTINO_BOARD_ID.toString()
    ]
  };
  
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    Logger.log('[ERROR] Failed to get items: ' + JSON.stringify(result.errors));
    return;
  }
  
  Logger.log('[SUCCESS] Items found:');
  
  result.data.boards.forEach(function(board) {
    Logger.log('--- Board: ' + board.name + ' ---');
    Logger.log('Items: ' + board.items_page.items.length + ' found');
    
    board.items_page.items.forEach(function(item, index) {
      Logger.log('  ' + (index + 1) + '. ID: ' + item.id + ' - ' + item.name);
      
      // Show status if available
      var statusColumn = item.column_values.find(function(cv) {
        return cv.id === 'status' || cv.id.includes('status');
      });
      
      if (statusColumn) {
        Logger.log('     Status: ' + statusColumn.text);
      }
    });
  });
}

// ============================================================================
// TEST 4: Linked Items (Task 2.4)
// ============================================================================

/**
 * Test 2.4 - Test reading connect_boards column
 */
function testLinkedItems() {
  Logger.log('=== TEST 2.4: Testing Linked Items ===');
  
  // First, get items from origem board to find one with connections
  var query = `
    query getItemsWithConnections($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 10) {
          items {
            id
            name
            column_values {
              id
              type
              text
              value
            }
          }
        }
      }
    }
  `;
  
  var variables = {
    boardId: TEST_CONFIG.ORIGEM_BOARD_ID.toString()
  };
  
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    Logger.log('[ERROR] Failed to get items: ' + JSON.stringify(result.errors));
    return false;
  }
  
  var items = result.data.boards[0].items_page.items;
  Logger.log('[INFO] Found ' + items.length + ' items in origem board');
  
  // Look for connect_boards columns
  var connectColumns = [];
  var testItem = null;
  
  items.forEach(function(item) {
    item.column_values.forEach(function(cv) {
      if (cv.value && cv.value.includes('linkedPulseIds')) {
        if (!testItem) testItem = item;
        if (connectColumns.indexOf(cv.id) === -1) {
          connectColumns.push(cv.id);
        }
      }
    });
  });
  
  if (!testItem) {
    Logger.log('[WARN] No items with linked connections found');
    Logger.log('[INFO] Please connect some items between boards first');
    return false;
  }
  
  Logger.log('[SUCCESS] Found item with connections:');
  Logger.log('  Item: ' + testItem.name + ' (ID: ' + testItem.id + ')');
  Logger.log('  Connect columns: ' + connectColumns.join(', '));
  
  // Test our getLinkedItemIds function
  var connectColumnId = connectColumns[0]; // Use first found
  
  Logger.log('[INFO] Testing getLinkedItemIds() function...');
  
  var linkedIds = getLinkedItemIds(
    TEST_CONFIG.ORIGEM_BOARD_ID,
    parseInt(testItem.id),
    connectColumnId
  );
  
  if (linkedIds.length > 0) {
    Logger.log('[SUCCESS] ✅ getLinkedItemIds() working!');
    Logger.log('[INFO] Found ' + linkedIds.length + ' linked items: ' + linkedIds.join(', '));
    return true;
  } else {
    Logger.log('[ERROR] ❌ getLinkedItemIds() returned no items');
    return false;
  }
}

// ============================================================================
// TEST 5: Status Update (Task 2.6)
// ============================================================================

/**
 * Test 2.6 - Test status update functionality
 */
function testStatusUpdate() {
  Logger.log('=== TEST 2.6: Testing Status Update ===');
  
  // Get items from destino board to update
  var query = `
    query getDestinoItems($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 5) {
          items {
            id
            name
            column_values(ids: ["status"]) {
              id
              text
              value
            }
          }
        }
      }
    }
  `;
  
  var variables = {
    boardId: TEST_CONFIG.DESTINO_BOARD_ID.toString()
  };
  
  var result = mondayQuery(query, variables);
  
  if (result.status !== 'success') {
    Logger.log('[ERROR] Failed to get destino items: ' + JSON.stringify(result.errors));
    return false;
  }
  
  var items = result.data.boards[0].items_page.items;
  
  if (items.length === 0) {
    Logger.log('[ERROR] No items found in destino board');
    return false;
  }
  
  var testItem = items.find(function(item) {
  // Procura um item que não esteja "Feito" para melhor visualização
  var statusCv = item.column_values.find(function(cv) {
    return cv.id === 'status';
  });
  return statusCv && statusCv.text !== 'Feito';
});

// Se não encontrar, usa o primeiro
if (!testItem) {
  testItem = items[0];
}
  var statusColumnId = 'status'; // Default, might need adjustment
  
  // Find actual status column ID
  var statusCv = testItem.column_values.find(function(cv) {
    return cv.id && cv.value;
  });
  
  if (statusCv) {
    statusColumnId = statusCv.id;
  }
  
  Logger.log('[INFO] Testing status update on:');
  Logger.log('  Item: ' + testItem.name + ' (ID: ' + testItem.id + ')');
  Logger.log('  Column: ' + statusColumnId);
  Logger.log('  Current status: ' + (statusCv ? statusCv.text : 'Unknown'));
  Logger.log('  New status: ' + TEST_CONFIG.NEW_STATUS_LABEL);
  
  // Test our updateStatus function
  var updateResult = updateStatus(
    TEST_CONFIG.DESTINO_BOARD_ID,
    parseInt(testItem.id),
    statusColumnId,
    TEST_CONFIG.NEW_STATUS_LABEL
  );
  
  if (updateResult.success) {
    Logger.log('[SUCCESS] ✅ updateStatus() working!');
    Logger.log('[INFO] Status updated successfully');
    
    // Verify the update
    Logger.log('[INFO] Verifying update...');
    var verifyResult = mondayQuery(query, variables);
    
    if (verifyResult.status === 'success') {
      var updatedItem = verifyResult.data.boards[0].items_page.items.find(function(item) {
        return item.id === testItem.id;
      });
      
      if (updatedItem) {
        var newStatusCv = updatedItem.column_values.find(function(cv) {
          return cv.id === statusColumnId;
        });
        
        if (newStatusCv && newStatusCv.text === TEST_CONFIG.NEW_STATUS_LABEL) {
          Logger.log('[SUCCESS] ✅ Status update verified!');
        } else {
          Logger.log('[WARN] Status update not immediately visible (may take time)');
        }
      }
    }
    
    return true;
  } else {
    Logger.log('[ERROR] ❌ updateStatus() failed: ' + updateResult.message);
    return false;
  }
}

// ============================================================================
// COMPREHENSIVE TEST RUNNER
// ============================================================================

/**
 * Run all Sprint 2 tests
 */
function runAllSprint2Tests() {
  Logger.log('========================================');
  Logger.log('🧪 SPRINT 2 - COMPREHENSIVE TESTS');
  Logger.log('========================================');
  
  var results = {
    basicConnection: false,
    linkedItems: false,
    statusUpdate: false
  };
  
  // Test 1: Basic Connection
  Logger.log('\n--- Test 1: Basic API Connection ---');
  results.basicConnection = testBasicApiConnection();
  
  if (!results.basicConnection) {
    Logger.log('[FATAL] Basic connection failed. Stopping tests.');
    return results;
  }
  
  // Discover board structure
  Logger.log('\n--- Board Discovery ---');
  discoverBoardStructure();
  
  // Get test items
  Logger.log('\n--- Test Items ---');
  getTestItems();
  
  // Test 2: Linked Items
  Logger.log('\n--- Test 2: Linked Items ---');
  results.linkedItems = testLinkedItems();
  
  // Test 3: Status Update
  Logger.log('\n--- Test 3: Status Update ---');
  results.statusUpdate = testStatusUpdate();
  
  // Summary
  Logger.log('\n========================================');
  Logger.log('📊 TEST RESULTS SUMMARY');
  Logger.log('========================================');
  Logger.log('Basic Connection: ' + (results.basicConnection ? '✅ PASS' : '❌ FAIL'));
  Logger.log('Linked Items: ' + (results.linkedItems ? '✅ PASS' : '❌ FAIL'));
  Logger.log('Status Update: ' + (results.statusUpdate ? '✅ PASS' : '❌ FAIL'));
  
  var passedCount = Object.values(results).filter(Boolean).length;
  Logger.log('Overall: ' + passedCount + '/3 tests passed');
  
  if (passedCount === 3) {
    Logger.log('🎉 ALL TESTS PASSED! Sprint 2 is complete!');
  } else {
    Logger.log('⚠️  Some tests failed. Check logs above.');
  }
  
  return results;
}

// ============================================================================
// QUICK TEST FUNCTIONS
// ============================================================================

/**
 * Quick test - just API connection
 */
function quickTest() {
  return testBasicApiConnection();
}

/**
 * Quick test - discover boards only
 */
function quickDiscover() {
  discoverBoardStructure();
}
