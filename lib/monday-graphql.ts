export class MondayGraphQL {
  private token: string;
  private baseUrl: string = 'https://api.monday.com/v2';

  constructor(token: string) {
    this.token = token;
  }

  async query(query: string, variables?: any): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/json',
          'API-Version': '2023-10'
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }

      if (data.errors && data.errors.length > 0) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      return {
        success: true,
        data: data.data,
        errors: null
      };

    } catch (error) {
      console.error('Monday GraphQL query failed:', error);
      return {
        success: false,
        data: null,
        errors: [error.message]
      };
    }
  }

  async findItemsByStatus(boardId: string, targetStatus: string): Promise<any[]> {
    const query = `
      query findItemsByStatus($boardId: ID!) {
        boards(ids: [$boardId]) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `;

    const result = await this.query(query, { boardId });
    
    if (!result.success) {
      throw new Error('Failed to fetch items');
    }

    const items = result.data.boards[0].items_page.items;
    const matchingItems = [];

    for (const item of items) {
      for (const column of item.column_values) {
        if ((column.type === 'color' || column.type === 'status') && 
            column.text === targetStatus) {
          matchingItems.push({
            id: item.id,
            name: item.name,
            statusColumnId: column.id
          });
          break;
        }
      }
    }

    return matchingItems;
  }

  async findItemsByPriority(boardId: string, priority: string): Promise<any[]> {
    const query = `
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

    // Primeiro encontrar coluna de prioridade
    const columnsResult = await this.query(query, { boardId });
    
    if (!columnsResult.success) {
      throw new Error('Failed to fetch board columns');
    }

    const columns = columnsResult.data.boards[0].columns;
    let priorityColumnId = null;

    for (const column of columns) {
      if (column.type === 'dropdown' && 
          (column.title.toLowerCase().includes('priority') ||
           column.title.toLowerCase().includes('prioridade'))) {
        priorityColumnId = column.id;
        break;
      }
    }

    if (!priorityColumnId) {
      throw new Error('Priority column not found');
    }

    // Buscar itens com prioridade
    const itemsQuery = `
      query getItemsByPriority($boardId: ID!, $columnId: String!) {
        boards(ids: [$boardId]) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values(ids: [$columnId]) {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `;

    const itemsResult = await this.query(itemsQuery, {
      boardId,
      columnId: priorityColumnId
    });

    if (!itemsResult.success) {
      throw new Error('Failed to fetch items');
    }

    const items = itemsResult.data.boards[0].items_page.items;
    const matchingItems = [];

    for (const item of items) {
      if (item.column_values && item.column_values.length > 0) {
        const columnValue = item.column_values[0];
        
        if (columnValue.text === priority) {
          matchingItems.push({
            id: item.id,
            name: item.name,
            priority: columnValue.text,
            priorityColumnId
          });
        }
      }
    }

    return matchingItems;
  }

  async findStatusColumn(boardId: string): Promise<string | null> {
    const query = `
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

    const result = await this.query(query, { boardId });
    
    if (!result.success) {
      throw new Error('Failed to fetch board columns');
    }

    const columns = result.data.boards[0].columns;

    for (const column of columns) {
      if (column.type === 'color' || column.type === 'status') {
        return column.id;
      }
    }

    return null;
  }

  async updateStatus(boardId: string, itemId: string, columnId: string, statusLabel: string): Promise<any> {
    const mutation = `
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

    const statusValue = JSON.stringify({ label: statusLabel });
    
    const result = await this.query(mutation, {
      boardId,
      itemId,
      columnId,
      value: statusValue
    });

    if (!result.success) {
      throw new Error('Failed to update status');
    }

    return {
      success: true,
      data: result.data.change_column_value
    };
  }

  async createItem(boardId: string, itemName: string): Promise<any> {
    const mutation = `
      mutation createItem($boardId: ID!, $itemName: String!) {
        create_item(
          board_id: $boardId,
          item_name: $itemName
        ) {
          id
          name
        }
      }
    `;

    const result = await this.query(mutation, {
      boardId,
      itemName
    });

    if (!result.success) {
      throw new Error('Failed to create item');
    }

    return result.data.create_item;
  }

  async copyItemColumns(sourceBoardId: string, sourceItemId: string, targetBoardId: string, targetItemId: string): Promise<void> {
    // Buscar colunas do item origem
    const sourceQuery = `
      query getItemDetails($boardId: ID!, $itemId: ID!) {
        boards(ids: [$boardId]) {
          items_page(limit: 1, query_params: {ids: [$itemId]}) {
            items {
              column_values {
                id
                value
                type
              }
            }
          }
        }
      }
    `;

    const sourceResult = await this.query(sourceQuery, {
      boardId: sourceBoardId,
      itemId: sourceItemId
    });

    if (!sourceResult.success) {
      throw new Error('Failed to fetch source item');
    }

    const sourceItem = sourceResult.data.boards[0].items_page.items[0];
    const columnValues: any = {};

    // Copiar valores (exceto colunas de sistema)
    for (const column of sourceItem.column_values) {
      if (column.type !== 'auto_number' && 
          column.type !== 'creation_log' &&
          column.type !== 'last_updated' &&
          column.value) {
        columnValues[column.id] = JSON.parse(column.value);
      }
    }

    // Atualizar item destino com os valores
    if (Object.keys(columnValues).length > 0) {
      const mutation = `
        mutation changeMultipleColumnValues($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(
            board_id: $boardId,
            item_id: $itemId,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      await this.query(mutation, {
        boardId: targetBoardId,
        itemId: targetItemId,
        columnValues: JSON.stringify(columnValues)
      });
    }
  }

  async archiveItem(boardId: string, itemId: string): Promise<void> {
    const mutation = `
      mutation archiveItem($boardId: ID!, $itemId: ID!) {
        archive_item(
          board_id: $boardId,
          item_id: $itemId
        ) {
          id
          archived
        }
      }
    `;

    await this.query(mutation, {
      boardId,
      itemId
    });
  }

  async getItemsByDateRange(boardId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      query getItemsByDate($boardId: ID!, $startDate: String!, $endDate: String!) {
        boards(ids: [$boardId]) {
          items_page(limit: 1000, query_params: {
            from_date: $startDate,
            to_date: $endDate
          }) {
            items {
              id
              name
              created_at
              updated_at
              column_values {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `;

    const result = await this.query(query, {
      boardId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (!result.success) {
      throw new Error('Failed to fetch items by date range');
    }

    return result.data.boards[0].items_page.items;
  }
}
