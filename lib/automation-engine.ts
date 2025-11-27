import { MondayGraphQL } from './monday-graphql';
import { EmailService } from './email-service';
import { ReportGenerator } from './report-generator';

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: any;
  schedule?: string;
  monday_token: string;
  monday_account_id: string;
}

export interface AutomationResult {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

export async function executeAutomation(automation: Automation): Promise<AutomationResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Starting automation: ${automation.name} (${automation.type})`);
    
    // Inicializar cliente Monday API
    const mondayAPI = new MondayGraphQL(automation.monday_token);
    
    let result: AutomationResult;
    
    // Executar baseado no tipo
    switch (automation.type) {
      case 'sync_status':
        result = await executeSyncStatus(automation, mondayAPI);
        break;
        
      case 'copy_items':
        result = await executeCopyItems(automation, mondayAPI);
        break;
        
      case 'generate_report':
        result = await executeGenerateReport(automation, mondayAPI);
        break;
        
      case 'alert_priority':
        result = await executeAlertPriority(automation, mondayAPI);
        break;
        
      default:
        throw new Error(`Unknown automation type: ${automation.type}`);
    }
    
    result.duration = Date.now() - startTime;
    
    console.log(`✅ Automation completed: ${automation.name} (${result.duration}ms)`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Automation failed: ${automation.name}`, error);
    
    return {
      success: false,
      message: error.message,
      duration,
      details: { error: error.message }
    };
  }
}

async function executeSyncStatus(automation: Automation, mondayAPI: MondayGraphQL): Promise<AutomationResult> {
  const { board_origem, board_destino, status_monitorar, status_aplicar } = automation.config;
  
  console.log(`🔄 Sync Status: ${board_origem} -> ${board_destino}`);
  
  // Encontrar itens com status monitorado
  const items = await mondayAPI.findItemsByStatus(board_origem, status_monitorar);
  
  if (items.length === 0) {
    return {
      success: true,
      message: `Nenhum item encontrado com status "${status_monitorar}"`,
      details: { itemsFound: 0 }
    };
  }
  
  // Encontrar coluna de status no destino
  const statusColumnId = await mondayAPI.findStatusColumn(board_destino);
  
  if (!statusColumnId) {
    throw new Error('Coluna de status não encontrada no board destino');
  }
  
  // Atualizar itens
  let updatedCount = 0;
  const errors: string[] = [];
  
  for (const item of items) {
    try {
      await mondayAPI.updateStatus(board_destino, item.id, statusColumnId, status_aplicar);
      updatedCount++;
    } catch (error) {
      errors.push(`Item ${item.id}: ${error.message}`);
    }
  }
  
  return {
    success: errors.length === 0,
    message: `Sincronização concluída. ${updatedCount} de ${items.length} itens atualizados.`,
    details: {
      itemsFound: items.length,
      itemsUpdated: updatedCount,
      errors
    }
  };
}

async function executeCopyItems(automation: Automation, mondayAPI: MondayGraphQL): Promise<AutomationResult> {
  const { board_origem, board_destino, filtro_status, manter_original } = automation.config;
  
  console.log(`📋 Copy Items: ${board_origem} -> ${board_destino}`);
  
  // Encontrar itens com status filtrado
  const items = await mondayAPI.findItemsByStatus(board_origem, filtro_status);
  
  if (items.length === 0) {
    return {
      success: true,
      message: `Nenhum item encontrado com status "${filtro_status}"`,
      details: { itemsFound: 0 }
    };
  }
  
  // Copiar itens
  let copiedCount = 0;
  const errors: string[] = [];
  
  for (const item of items) {
    try {
      // Criar novo item no destino
      const newItem = await mondayAPI.createItem(board_destino, `${item.name} (Cópia)`);
      
      // Copiar colunas (exceto sistema)
      await mondayAPI.copyItemColumns(board_origem, item.id, board_destino, newItem.id);
      
      copiedCount++;
      
      // Se não manter original, arquivar
      if (!manter_original) {
        await mondayAPI.archiveItem(board_origem, item.id);
      }
      
    } catch (error) {
      errors.push(`Item ${item.name}: ${error.message}`);
    }
  }
  
  return {
    success: errors.length === 0,
    message: `Cópia concluída. ${copiedCount} de ${items.length} itens copiados.`,
    details: {
      itemsFound: items.length,
      itemsCopied: copiedCount,
      manterOriginal: manter_original,
      errors
    }
  };
}

async function executeGenerateReport(automation: Automation, mondayAPI: MondayGraphQL): Promise<AutomationResult> {
  const { board_origem, periodo, formato, email_destino } = automation.config;
  
  console.log(`📊 Generate Report: ${board_origem} (${periodo})`);
  
  // Calcular datas
  const dates = calculatePeriodDates(periodo);
  
  // Buscar itens do período
  const items = await mondayAPI.getItemsByDateRange(board_origem, dates.start, dates.end);
  
  // Gerar relatório
  const reportGenerator = new ReportGenerator();
  let reportContent: string;
  let filename: string;
  
  switch (formato) {
    case 'CSV':
      reportContent = reportGenerator.generateCSV(items);
      filename = `relatorio-${periodo.toLowerCase()}-${Date.now()}.csv`;
      break;
      
    case 'Detalhado':
      reportContent = reportGenerator.generateDetailed(items, periodo);
      filename = `relatorio-detalhado-${periodo.toLowerCase()}.txt`;
      break;
      
    default: // Resumo
      reportContent = reportGenerator.generateSummary(items, periodo);
      filename = `relatorio-resumo-${periodo.toLowerCase()}.txt`;
  }
  
  // Enviar por email se especificado
  if (email_destino) {
    const emailService = new EmailService();
    await emailService.sendReport(email_destino, reportContent, filename);
  }
  
  return {
    success: true,
    message: `Relatório gerado com ${items.length} itens.`,
    details: {
      periodo,
      formato,
      itemsProcessados: items.length,
      filename,
      emailEnviado: !!email_destino
    }
  };
}

async function executeAlertPriority(automation: Automation, mondayAPI: MondayGraphQL): Promise<AutomationResult> {
  const { board_origem, prioridade, email_destino } = automation.config;
  
  console.log(`🚨 Alert Priority: ${board_origem} (${prioridade})`);
  
  // Encontrar itens com prioridade especificada
  const items = await mondayAPI.findItemsByPriority(board_origem, prioridade);
  
  if (items.length === 0) {
    return {
      success: true,
      message: `Nenhum item encontrado com prioridade "${prioridade}"`,
      details: { itemsFound: 0 }
    };
  }
  
  // Preparar e enviar alerta
  const emailService = new EmailService();
  const alertContent = preparePriorityAlert(items, prioridade);
  
  await emailService.sendAlert(email_destino, '🚨 Alerta de Prioridade', alertContent);
  
  return {
    success: true,
    message: `Alerta enviado para ${items.length} itens com prioridade "${prioridade}"`,
    details: {
      prioridade,
      emailDestino: email_destino,
      itemsFound: items.length
    }
  };
}

function calculatePeriodDates(periodo: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();
  
  switch (periodo) {
    case 'Hoje':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'Ontem':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'Últimos 7 dias':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = now;
      break;
      
    case 'Últimos 30 dias':
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = now;
      break;
      
    default:
      throw new Error(`Período inválido: ${periodo}`);
  }
  
  return { start, end };
}

function preparePriorityAlert(items: any[], priority: string): string {
  let content = `🚨 ALERTA DE PRIORIDADE: ${priority.toUpperCase()}\n\n`;
  content += `Foram encontrados ${items.length} itens com prioridade ${priority}:\n\n`;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    content += `${i + 1}. ${item.name} (ID: ${item.id})\n`;
  }
  
  content += `\n⏰ Verificado em: ${new Date().toLocaleString()}`;
  
  return content;
}
