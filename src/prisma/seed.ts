import "dotenv/config";
import { prisma } from "../lib/db";
import { usuarioService } from "../services/usuario.service";

async function main() {
  const usuario = process.env.SEED_ADMIN_USER?.trim();
  const senha = process.env.SEED_ADMIN_PASSWORD;

  if (!usuario || !senha || senha.length < 8) {
    throw new Error(
      "Defina SEED_ADMIN_USER e SEED_ADMIN_PASSWORD (com pelo menos 8 caracteres) no .env antes de executar a seed.",
    );
  }

  const existente = await prisma.usuario.findUnique({
    where: { usuario },
    select: { id: true, ativo: true, papel: true },
  });

  if (existente) {
    if (existente.ativo && existente.papel === "ADMINISTRADOR") {
      console.info(`Seed já aplicada: o administrador "${usuario}" está ativo.`);
      return;
    }
    throw new Error(
      `O nome "${usuario}" já pertence a uma conta inativa ou que não é administradora. Nenhuma alteração foi feita.`,
    );
  }

  const usuariosAtivos = await usuarioService.contarAtivos();
  if (usuariosAtivos > 0) {
    throw new Error(
      "Já existem usuários ativos no banco. A seed inicial não criou outra conta administradora.",
    );
  }

  const administrador = await usuarioService.criar({
    usuario,
    senha,
    papel: "ADMINISTRADOR",
  });

  console.info(`Administrador inicial "${administrador.usuario}" criado com sucesso.`);
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar a seed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
