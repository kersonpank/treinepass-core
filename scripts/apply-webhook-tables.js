/**
 * Script para aplicar as tabelas e funu00e7u00f5es de webhook diretamente no banco de dados
 * 
 * Este script lu00ea o arquivo SQL e o executa diretamente no banco de dados
 * usando as variu00e1veis de ambiente do Supabase.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configurau00e7u00f5es do banco de dados
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

// Funu00e7u00e3o para executar o script SQL
async function executeSqlScript(scriptPath) {
  console.log(`Lendo arquivo SQL: ${scriptPath}`);
  
  // Ler o arquivo SQL
  const sqlScript = fs.readFileSync(scriptPath, 'utf8');
  
  // Conectar ao banco de dados
  console.log('Conectando ao banco de dados...');
  const pool = new Pool(dbConfig);
  
  try {
    // Iniciar uma transau00e7u00e3o
    const client = await pool.connect();
    console.log('Conexu00e3o estabelecida. Iniciando transau00e7u00e3o...');
    
    try {
      await client.query('BEGIN');
      
      // Executar o script SQL
      console.log('Executando script SQL...');
      await client.query(sqlScript);
      
      // Commit da transau00e7u00e3o
      await client.query('COMMIT');
      console.log('Script SQL executado com sucesso!');
    } catch (err) {
      // Rollback em caso de erro
      await client.query('ROLLBACK');
      console.error('Erro ao executar script SQL:', err);
      throw err;
    } finally {
      // Liberar o cliente
      client.release();
    }
  } finally {
    // Fechar o pool
    await pool.end();
  }
}

// Funu00e7u00e3o principal
async function main() {
  try {
    // Caminho para o script SQL
    const scriptPath = path.resolve(__dirname, 'create-webhook-tables.sql');
    
    // Executar o script
    await executeSqlScript(scriptPath);
    
    console.log('\nTabelas e funu00e7u00f5es de webhook criadas com sucesso!');
  } catch (err) {
    console.error('\nErro ao aplicar tabelas e funu00e7u00f5es de webhook:', err);
    process.exit(1);
  }
}

// Executar o script
main();
