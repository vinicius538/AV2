import Fastify from 'fastify'

const app = Fastify({ logger: true })

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🚀 Servidor rodando em http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

process.on('SIGTERM',() =>{
    server.close(()=>{
        process.exit(0)
    })
    //db.close(()=>{
    //    process.exit(0)
    //})
})
