import "dotenv/config";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { authRoutes } from "./src/routes/auth.routes";
import { organizacaoRoutes } from "./src/routes/organizacao.routes";
import { contratoVersionRoutes } from "./src/routes/contrato.routes";
import { loteVersionRoutes } from "./src/routes/lote.routes";
import { equipamentoVersionRoutes } from "./src/routes/equipamento.routes";
import { usuarioRoutes } from "./src/routes/usuario.routes";
import { journalRoutes } from "./src/routes/journal.routes";
import { movimentacaoRoutes } from "./src/routes/movimentacao.routes";
import { configuracaoRoutes } from "./src/routes/configuracao.routes";

export function criarApp(opcoes: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opcoes.logger ?? true });
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

  return app;
}



//⠀⠀⠀⠀⠀⢸⠓⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⢸⠀⠀⠑⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⢸⡆⠀⠀⠀⠙⢤⡷⣤⣦⣀⠤⠖⠚⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⣠⡿⠢⢄⡀⠀⡇⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠸⠷⣶⠂⠀⠀⠀⣀⣀⠀⠀⠀
//⢸⣃⠀⠀⠉⠳⣷⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠉⠉⠉⢉⡭⠋
//⠀⠘⣆⠀⠀⠀⠁⠀⢀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠋⠀⠀
//⠀⠀⠘⣦⠆⠀⠀⢀⡎⢹⡀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⡀⣠⠔⠋⠀⠀⠀⠀
//⠀⠀⠀⡏⠀⠀⣆⠘⣄⠸⢧⠀⠀⠀⠀⢀⣠⠖⢻⠀⠀⠀⣿⢥⣄⣀⣀⣀⠀⠀
//⠀⠀⢸⠁⠀⠀⡏⢣⣌⠙⠚⠀⠀⠠⣖⡛⠀⣠⠏⠀⠀⠀⠇⠀⠀⠀⠀⢙⣣⠄
//⠀⠀⢸⡀⠀⠀⠳⡞⠈⢻⠶⠤⣄⣀⣈⣉⣉⣡⡔⠀⠀⢀⠀⠀⣀⡤⠖⠚⠀⠀
//⠀⠀⡼⣇⠀⠀⠀⠙⠦⣞⡀⠀⢀⡏⠀⢸⣣⠞⠀⠀⠀⡼⠚⠋⠁⠀⠀⠀⠀⠀
//⠀⢰⡇⠙⠀⠀⠀⠀⠀⠀⠉⠙⠚⠒⠚⠉⠀⠀⠀⠀⡼⠁⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⢧⡀⠀⢠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠙⣶⣶⣿⠢⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠉⠀⠀⠀⠙⢿⣳⠞⠳⡄⠀⠀⠀⢀⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⠹⣄⣀⡤⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀