import fastify from "fastify";

const app = fastify({logger:true})

app.get('/organizacao', async (request, reply) => {
  const {
    id,
    razaoSocial,
    cnpj,
    inscricaoEstadual,
    enderecoCompleto,
    telefone,
    email,
    dataCadastro,
    ativo,
    contratoVigente
  } = request.body as{
    id: string
    razaoSocial: string,
    cnpj: string
    inscricaoEstadual: string
    enderecoCompleto: string
    telefone: string
    email: string
    dataCadastro: Date
    ativo: boolean
    contratoVigente: string
  }
})