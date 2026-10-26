import "dotenv/config";
import { criarApp } from "./app";
import { prisma } from "./src/lib/db";

const app = criarApp();
let shutdownPromise: Promise<void> | undefined;

function shutdown(signal: string): Promise<void> {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    app.log.info({ signal }, "Iniciando encerramento graceful do servidor.");
    try {
      // Fecha o listener e aguarda as requisições em andamento terminarem.
      await app.close();
      app.log.info("Servidor HTTP encerrado.");
    } catch (error) {
      app.log.error(error, "Erro ao encerrar o servidor HTTP.");
      process.exitCode = 1;
    } finally {
      try {
        await prisma.$disconnect();
        app.log.info("Conexão com o banco encerrada.");
      } catch (error) {
        app.log.error(error, "Erro ao desconectar do banco.");
        process.exitCode = 1;
      }
    }
  })();

  return shutdownPromise;
}

async function start() {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    app.log.info("Servidor rodando em http://localhost:3000");
  } catch (error) {
    app.log.error(error, "Não foi possível iniciar o servidor.");
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      app.log.error(disconnectError, "Erro ao desconectar o Prisma após falha de inicialização.");
    }
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
void start();
