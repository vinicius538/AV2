import fastify from "fastify";

fastify.get('/', async (request, reply) => {
  return { hello: 'world' } // O Fastify serializa objetos para JSON automaticamente
})