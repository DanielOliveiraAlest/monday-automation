import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';
import { executeAutomation } from '@/lib/automation-engine';

export async function GET(request: NextRequest) {
  try {
    // Verificar se é chamada do cron (segurança)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }

    console.log('🔄 Starting 24/7 automation check...');

    // Conectar ao database
    const client = createClient();
    await client.connect();

    // Buscar automações ativas que precisam executar
    const { rows: automations } = await client.query(`
      SELECT a.*, u.monday_token, u.monday_account_id
      FROM automations a
      JOIN users u ON a.user_id = u.id
      WHERE a.active = true 
      AND (
        a.schedule IS NOT NULL 
        OR a.type IN ('sync_status', 'alert_priority')
      )
      AND (
        a.last_executed IS NULL 
        OR a.last_executed < NOW() - INTERVAL '1 minute'
      )
    `);

    console.log(`📊 Found ${automations.length} automations to execute`);

    const results = [];
    const errors = [];

    // Processar cada automação em paralelo
    const promises = automations.map(async (automation) => {
      try {
        console.log(`⚡ Executing automation: ${automation.name} (${automation.id})`);

        // Executar automação
        const result = await executeAutomation(automation);

        // Atualizar status no database
        await client.query(
          `UPDATE automations 
           SET last_executed = NOW(), 
               last_status = $1, 
               last_result = $2,
               execution_count = execution_count + 1
           WHERE id = $3`,
          [
            result.success ? 'success' : 'error',
            JSON.stringify(result),
            automation.id
          ]
        );

        // Log do resultado
        console.log(`✅ Automation ${automation.id}: ${result.success ? 'SUCCESS' : 'ERROR'}`);

        results.push({
          id: automation.id,
          name: automation.name,
          success: result.success,
          message: result.message,
          duration: result.duration
        });

      } catch (error) {
        console.error(`❌ Automation ${automation.id} failed:`, error);

        // Atualizar status de erro
        await client.query(
          `UPDATE automations 
           SET last_executed = NOW(), 
               last_status = 'error', 
               last_result = $1
           WHERE id = $2`,
          [JSON.stringify({ error: error.message }), automation.id]
        );

        errors.push({
          id: automation.id,
          name: automation.name,
          error: error.message
        });
      }
    });

    // Aguardar todas as execuções
    await Promise.all(promises);

    await client.end();

    // Estatísticas
    const successCount = results.filter(r => r.success).length;
    const errorCount = errors.length;
    const totalCount = automations.length;

    console.log(`📈 24/7 Check completed: ${successCount} success, ${errorCount} errors, ${totalCount} total`);

    // Enviar alertas se muitos erros
    if (errorCount > 0) {
      await sendErrorAlert(errors);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        total: totalCount,
        success: successCount,
        errors: errorCount,
        duration: Date.now() - Date.now()
      },
      results: results,
      errors: errors
    });

  } catch (error) {
    console.error('❌ 24/7 automation check failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function sendErrorAlert(errors: any[]) {
  try {
    // Enviar alerta para Slack/email
    const errorSummary = errors.map(e => `${e.name}: ${e.error}`).join('\n');
    
    console.log('🚨 ERROR ALERT:');
    console.log(errorSummary);
    
    // Implementar envio real para Slack/email aqui
    // await sendSlackAlert(errorSummary);
    // await sendEmailAlert(errorSummary);
    
  } catch (error) {
    console.error('Failed to send error alert:', error);
  }
}
