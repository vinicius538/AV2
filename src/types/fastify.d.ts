import "@fastify/jwt";

type Papel = "ADMINISTRADOR" | "OPERADOR_CADASTRO" | "GESTOR_ALMOXARIFADO" | "AUDITOR";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string; iat: number; exp: number };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser: { id: string; usuario: string; papel: Papel } | null;
  }
}
