'use strict'
 
const fastify = require('fastify')({ logger: true })
fastify.register(require('fastify-cors'))
const PORT = process.env.PORT || 3000;
fastify.register(require('fastify-mailer'), {
  defaults: { from: 'MadvertLabs <madmailserver@gmail.com>' },
  transport: {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: process.env.USERNAME,
      pass: process.env.PASSWORD
    },
  }
})
fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  })
fastify.post('/api/send', (request, reply) => {

  const { mailer } = fastify
  const {to,subject,msg,token} = request.body
  if(typeof(token)=="undefined" || token!=process.env.TOKEN.toString()){
      return {auth:false}
  }
  const res= mailer.sendMail({
    to: to,
    subject: subject,
    text: msg
  },(errors, info) => {
      console.log(info)
    if (errors) {
      return {
        status: 'error',
        message: 'Something went wrong'
      }
    }
    reply.send({
      status: 'ok',
      message: 'Email successfully sent!',
      SentTo:info.envelope.to
    })
    return
  })
})
 
fastify.listen(PORT,"0.0.0.0", (errors) => {
  if (errors) {
    fastify.log.error(errors)
    process.exit(1)
  }
})