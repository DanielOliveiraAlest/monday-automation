/**
 * Monday.com Webhook Test Suite
 * 
 * Run these functions from Google Apps Script editor to test
 * your webhook endpoint before configuring Monday.com webhooks
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Update this with your actual Web App URL
var WEBHOOK_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Challenge Response
 * Tests if the endpoint correctly responds to Monday.com challenge
 */
function testChallengeResponse() {
  Logger.log("🧪 Testing Monday.com Challenge Response...");
  
  var payload = {
    "challenge": "test_challenge_12345"
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true // Don't throw on errors
  };
  
  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log("Status Code: " + responseCode);
    Logger.log("Response: " + responseText);
    
    if (responseCode === 200) {
      var data = JSON.parse(responseText);
      if (data.challenge === payload.challenge) {
        Logger.log("✅ Challenge test PASSED");
        return true;
      } else {
        Logger.log("❌ Challenge test FAILED - wrong challenge returned");
        return false;
      }
    } else {
      Logger.log("❌ Challenge test FAILED - HTTP " + responseCode);
      return false;
    }
    
  } catch (e) {
    Logger.log("❌ Challenge test FAILED - Exception: " + e);
    return false;
  }
}

/**
 * Test 2: Health Check
 * Tests the health check endpoint
 */
function testHealthCheck() {
  Logger.log("🏥 Testing Health Check...");
  
  var url = WEBHOOK_URL + "?health=true";
  
  var options = {
    "method": "get",
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log("Status Code: " + responseCode);
    Logger.log("Response: " + responseText);
    
    if (responseCode === 200) {
      var data = JSON.parse(responseText);
      if (data.status === "ok") {
        Logger.log("✅ Health check PASSED");
        return true;
      } else {
        Logger.log("❌ Health check FAILED - invalid response");
        return false;
      }
    } else {
      Logger.log("❌ Health check FAILED - HTTP " + responseCode);
      return false;
    }
    
  } catch (e) {
    Logger.log("❌ Health check FAILED - Exception: " + e);
    return false;
  }
}

/**
 * Test 3: Webhook Payload
 * Tests actual webhook payload processing
 */
function testWebhookPayload() {
  Logger.log("📦 Testing Webhook Payload...");
  
  var payload = {
    "event": {
      "type": "change_column_value",
      "boardId": "18390046494",
      "itemId": "1234567890",
      "columnId": "status",
      "value": {
        "label": {
          "text": "Done"
        }
      }
    }
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log("Status Code: " + responseCode);
    Logger.log("Response: " + responseText);
    
    if (responseCode === 200) {
      var data = JSON.parse(responseText);
      if (data.status === "success") {
        Logger.log("✅ Webhook payload test PASSED");
        return true;
      } else {
        Logger.log("❌ Webhook payload test FAILED - invalid response");
        return false;
      }
    } else {
      Logger.log("❌ Webhook payload test FAILED - HTTP " + responseCode);
      return false;
    }
    
  } catch (e) {
    Logger.log("❌ Webhook payload test FAILED - Exception: " + e);
    return false;
  }
}

/**
 * Test 4: Invalid Challenge
 * Tests with invalid challenge to ensure proper validation
 */
function testInvalidChallenge() {
  Logger.log("🚫 Testing Invalid Challenge...");
  
  var payload = {
    "challenge": "wrong_challenge"
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log("Status Code: " + responseCode);
    Logger.log("Response: " + responseText);
    
    // Should still respond with the challenge (even if invalid)
    if (responseCode === 200) {
      var data = JSON.parse(responseText);
      if (data.challenge === "wrong_challenge") {
        Logger.log("✅ Invalid challenge test PASSED (echoes back challenge)");
        return true;
      } else {
        Logger.log("❌ Invalid challenge test FAILED");
        return false;
      }
    } else {
      Logger.log("❌ Invalid challenge test FAILED - HTTP " + responseCode);
      return false;
    }
    
  } catch (e) {
    Logger.log("❌ Invalid challenge test FAILED - Exception: " + e);
    return false;
  }
}

/**
 * Test 5: Empty Payload
 * Tests endpoint behavior with empty payload
 */
function testEmptyPayload() {
  Logger.log("📭 Testing Empty Payload...");
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": "{}",
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log("Status Code: " + responseCode);
    Logger.log("Response: " + responseText);
    
    // Should handle gracefully
    if (responseCode === 200) {
      Logger.log("✅ Empty payload test PASSED");
      return true;
    } else {
      Logger.log("❌ Empty payload test FAILED - HTTP " + responseCode);
      return false;
    }
    
  } catch (e) {
    Logger.log("❌ Empty payload test FAILED - Exception: " + e);
    return false;
  }
}

// ============================================================================
// MASTER TEST RUNNER
// ============================================================================

/**
 * Run all tests
 * Execute this function to run the complete test suite
 */
function runAllTests() {
  Logger.log("🚀 Monday.com Webhook Test Suite");
  Logger.log("=".repeat(50));
  
  if (WEBHOOK_URL === "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec") {
    Logger.log("⚠️  Please update WEBHOOK_URL with your actual Web App URL");
    return;
  }
  
  Logger.log("Testing URL: " + WEBHOOK_URL);
  Logger.log("");
  
  var tests = [
    { name: "Challenge Response", func: testChallengeResponse },
    { name: "Health Check", func: testHealthCheck },
    { name: "Webhook Payload", func: testWebhookPayload },
    { name: "Invalid Challenge", func: testInvalidChallenge },
    { name: "Empty Payload", func: testEmptyPayload }
  ];
  
  var passed = 0;
  var total = tests.length;
  
  for (var i = 0; i < tests.length; i++) {
    Logger.log("Running Test " + (i + 1) + ": " + tests[i].name);
    if (tests[i].func()) {
      passed++;
    }
    Logger.log("");
  }
  
  Logger.log("=".repeat(50));
  Logger.log("📊 Results: " + passed + "/" + total + " tests passed");
  
  if (passed === total) {
    Logger.log("🎉 All tests PASSED! Ready for webhook configuration.");
    Logger.log("");
    Logger.log("🚀 Next step: Configure webhook in Monday.com");
  } else {
    Logger.log("⚠️  Some tests failed. Check the configuration.");
  }
}

/**
 * Quick Test - Only essential tests
 * Run this for a quick validation
 */
function runQuickTest() {
  Logger.log("⚡ Quick Webhook Test");
  Logger.log("=".repeat(30));
  
  if (WEBHOOK_URL === "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec") {
    Logger.log("⚠️  Please update WEBHOOK_URL with your actual Web App URL");
    return;
  }
  
  var challengePassed = testChallengeResponse();
  Logger.log("");
  var healthPassed = testHealthCheck();
  
  Logger.log("=".repeat(30));
  if (challengePassed && healthPassed) {
    Logger.log("✅ Quick test PASSED! Ready for Monday.com webhook.");
  } else {
    Logger.log("❌ Quick test FAILED. Check logs for details.");
  }
}

/**
 * Set Webhook URL
 * Helper function to update the webhook URL
 */
function setWebhookUrl(url) {
  WEBHOOK_URL = url;
  PropertiesService.getScriptProperties()
    .setProperty('WEBHOOK_TEST_URL', url);
  Logger.log("✅ Webhook URL updated: " + url);
}

/**
 * Get Webhook URL
 * Helper function to retrieve saved webhook URL
 */
function getWebhookUrl() {
  var savedUrl = PropertiesService.getScriptProperties()
    .getProperty('WEBHOOK_TEST_URL');
  if (savedUrl) {
    WEBHOOK_URL = savedUrl;
  }
  Logger.log("Current Webhook URL: " + WEBHOOK_URL);
  return WEBHOOK_URL;
}
