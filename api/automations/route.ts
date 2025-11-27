import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await validateToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Conectar ao database
    const client = createClient();
    await client.connect();

    // Buscar automações do usuário
    const { rows } = await client.query(
      'SELECT * FROM automations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await validateToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, type, config, schedule } = body;

    // Validar campos obrigatórios
    if (!name || !type || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, config' },
        { status: 400 }
      );
    }

    // Validar tipo de automação
    const validTypes = ['sync_status', 'copy_items', 'generate_report', 'alert_priority'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid automation type' },
        { status: 400 }
      );
    }

    // Conectar ao database
    const client = createClient();
    await client.connect();

    // Criar automação
    const { rows } = await client.query(
      `INSERT INTO automations (user_id, name, type, config, schedule, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [userId, name, type, JSON.stringify(config), schedule || null, true]
    );

    await client.end();

    // Limpar cache
    await kv.del(`automations:${userId}`);

    // Log da criação
    console.log(`Automation created: ${rows[0].id} by user ${userId}`);

    return NextResponse.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function validateToken(token: string): Promise<string | null> {
  try {
    // Implementar validação JWT
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}
