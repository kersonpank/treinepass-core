import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Criar um cliente Supabase com permissões de administrador
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Obter o token de autorização do cabeçalho
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.substring(7); // Remover 'Bearer ' do cabeçalho

  try {
    // Verificar o token e obter o usuário
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Verificar se o usuário é administrador
    const { data: userData, error: userError } = await adminSupabase
      .from('user_types')
      .select('type')
      .eq('user_id', user.id)
      .eq('type', 'admin')
      .maybeSingle();

    if (userError) {
      console.error('Erro ao verificar tipo de usuário:', userError);
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }

    if (!userData) {
      return res.status(403).json({ error: 'Acesso negado. Usuário não é administrador.' });
    }

    // Processar a requisição
    if (req.method === 'GET') {
      // Buscar eventos de webhook
      const { tab } = req.query;
      
      let query = adminSupabase
        .from('asaas_webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tab === 'errors') {
        query = query.or('processed.eq.false,error_message.not.is.null');
      } else if (tab === 'success') {
        query = query.eq('processed', true).is('error_message', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      // Reprocessar um evento
      const { eventId } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ error: 'ID do evento não fornecido' });
      }

      const { data, error } = await adminSupabase.rpc('reprocess_failed_webhook_event', {
        event_id: eventId,
      });

      if (error) {
        console.error('Erro ao reprocessar evento:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (err) {
    console.error('Erro na API de eventos de webhook:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
