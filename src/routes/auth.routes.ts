import type { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const { usuario, senha } = request.body as {
      usuario: string;
      senha: string;
    };
  });
}
