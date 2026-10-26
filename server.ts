import "dotenv/config";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { prisma } from "./src/lib/db";
import { authRoutes } from "./src/routes/auth.routes";
import { organizacaoRoutes } from "./src/routes/organizacao.routes";
import { contratoVersionRoutes } from "./src/routes/contrato.routes";
import { loteVersionRoutes } from "./src/routes/lote.routes";
import { equipamentoVersionRoutes } from "./src/routes/equipamento.routes";
import { usuarioRoutes } from "./src/routes/usuario.routes";
import { journalRoutes } from "./src/routes/journal.routes";
import { movimentacaoRoutes } from "./src/routes/movimentacao.routes";
import { configuracaoRoutes } from "./src/routes/configuracao.routes";

const app = Fastify({ logger: true });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error("JWT_SECRET precisa estar definido e ter pelo menos 32 bytes.");
}

app.register(jwt, { secret: jwtSecret, sign: { expiresIn: "30m" } });
app.decorateRequest("authenticatedUser", null);

app.register(authRoutes);
app.register(organizacaoRoutes);
app.register(contratoVersionRoutes);
app.register(loteVersionRoutes);
app.register(equipamentoVersionRoutes);
app.register(usuarioRoutes);
app.register(journalRoutes);
app.register(movimentacaoRoutes);
app.register(configuracaoRoutes);

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

const start = async () => {
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
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start();
