import fastify from 'fastify';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const package_json = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf-8'));
const version = package_json.version || '-';

export async function startServer(options?: { port?: number; host?: string }) {
  const server = fastify({
    logger: true
  });

  // Health check endpoint
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Root endpoint
  server.get('/', async (request, reply) => {
    return { message: 'MRM V3 Backend API', version };
  });

  async function start() {
    try {
      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
      const host = process.env.HOST || '0.0.0.0';
      
      await server.listen({ port, host });
      console.log(`Server listening on http://${host}:${port}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  }
  
  try {
    start();
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}