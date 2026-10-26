import type { FastifyInstance } from "fastify";
import { login } from "../controllers/auth.controller";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["usuario", "senha"],
          properties: {
            usuario: { type: "string", minLength: 1, maxLength: 100 },
            senha: { type: "string", minLength: 1, maxLength: 128 },
          },
        },
      },
    },
    login,
  );
}
