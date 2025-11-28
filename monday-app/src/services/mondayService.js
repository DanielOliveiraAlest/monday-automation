/**
 * Monday.com API Service
 * Handles all interactions with Monday.com GraphQL API
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class MondayService {
  constructor() {
    this.apiUrl = 'https://api.monday.com/v2';
    this.apiVersion = '2024-01';
  }

  /**
   * Execute GraphQL query
   */
  async query(query, variables = {}, token) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          query,
          variables
        },
        {
          headers: {
            'Authorization': token,
            'API-Version': this.apiVersion,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errors) {
        throw new Error(`Monday API Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error) {
      logger.error('Monday API query failed:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getMe(token) {
    const query = `
      query {
        me {
          id
          name
          email
          account {
            id
            name
            slug
            plan {
              tier
              max_users
            }
          }
        }
      }
    `;
    return this.query(query, {}, token);
  }

  /**
   * Get boards
   */
  async getBoards(token, limit = 50) {
    const query = `
      query ($limit: Int!) {
        boards(limit: $limit) {
          id
          name
          description
          state
          board_folder_id
          board_kind
          owner {
            id
            name
          }
          groups {
            id
            title
          }
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;
    return this.query(query, { limit }, token);
  }

  /**
   * Get items from board
   */
  async getItems(boardId, token, limit = 100) {
    const query = `
      query ($boardId: ID!, $limit: Int!) {
        boards(ids: [$boardId]) {
          items_page(limit: $limit) {
            cursor
            items {
              id
              name
              state
              created_at
              updated_at
              column_values {
                id
                type
                text
                value
              }
              subitems {
                id
                name
              }
            }
          }
        }
      }
    `;
    return this.query(query, { boardId, limit }, token);
  }

  /**
   * Update column value
   */
  async updateColumnValue(boardId, itemId, columnId, value, token) {
    const mutation = `
      mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(
          board_id: $boardId,
          item_id: $itemId,
          column_id: $columnId,
          value: $value
        ) {
          id
          name
        }
      }
    `;
    return this.query(mutation, { boardId, itemId, columnId, value }, token);
  }

  /**
   * Create item
   */
  async createItem(boardId, groupId, itemName, columnValues = {}, token) {
    const mutation = `
      mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON) {
        create_item(
          board_id: $boardId,
          group_id: $groupId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
        }
      }
    `;
    return this.query(mutation, { boardId, groupId, itemName, columnValues }, token);
  }

  /**
   * Create webhook
   */
  async createWebhook(boardId, url, event, token, config = {}) {
    const mutation = `
      mutation ($boardId: ID!, $url: String!, $event: WebhookEventType!, $config: JSON) {
        create_webhook(
          board_id: $boardId,
          url: $url,
          event: $event,
          config: $config
        ) {
          id
          board_id
          url
          event
        }
      }
    `;
    return this.query(mutation, { boardId, url, event, config }, token);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId, token) {
    const mutation = `
      mutation ($id: ID!) {
        delete_webhook(id: $id) {
          id
        }
      }
    `;
    return this.query(mutation, { id: webhookId }, token);
  }

  /**
   * Get connected items
   */
  async getConnectedItems(itemId, token) {
    const query = `
      query ($itemId: ID!) {
        items(ids: [$itemId]) {
          id
          name
          column_values {
            id
            type
            value
            ... on BoardRelationValue {
              linked_item_ids
            }
          }
        }
      }
    `;
    return this.query(query, { itemId }, token);
  }

  /**
   * Execute automation recipe
   */
  async executeAutomation(automationId, payload, token) {
    // This would integrate with Monday's automation framework
    logger.info(`Executing automation ${automationId}`, payload);
    // Implementation depends on specific automation requirements
    return { success: true, automationId, timestamp: new Date().toISOString() };
  }
}

module.exports = new MondayService();
