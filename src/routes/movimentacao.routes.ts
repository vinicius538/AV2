import type { FastifyInstance } from "fastify";

export async function movimentacaoRoutes(app: FastifyInstance) {
  app.post("/equipamentos/:equipamentoId/movimentacoes", async (request, reply) => {
    const { origem, destino, responsavel, observacao } = request.body as {
      origem: string;
      destino: string;
      responsavel: string;
      observacao?: string;
    };
  });
}
