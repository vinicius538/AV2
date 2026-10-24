import Fastify from "fastify";
import { prisma } from "./src/lib/db";
import { organizacaoRoutes } from "./src/routes/organizacao.routes";
import { contratoVersionRoutes } from "./src/routes/contrato.routes";
import { loteVersionRoutes } from "./src/routes/lote.routes";
import { equipamentoVersionRoutes } from "./src/routes/equipamento.routes";

const app = Fastify({ logger: true });

app.register(organizacaoRoutes);
app.register(contratoVersionRoutes);
app.register(loteVersionRoutes);
app.register(equipamentoVersionRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    app.log.info("Servidor rodando em http://localhost:3000");
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  }
};

const shutdown = async (signal: string) => {
  app.log.info(`Recebido ${signal}; encerrando servidor.`);
  try {
    await app.close();
    await prisma.$disconnect();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start();
