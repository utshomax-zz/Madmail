'use strict'
 
const fastify = require('fastify')({ logger: true })
const fetch = require('node-fetch');
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
fastify.post('/api/send',async (request, reply) => {
  var location;
  var userdata={};
  var loc= await fetch(`http://api.ipstack.com/${request.body.ip}?access_key=3038ed99464d9d0eb1fe199a3b76ae46&format=1`)
  if(!loc.ok){
    location=null;
  }
  else{
    location =await loc.json();
  }
  if(location!=null && location.latitude!=null){
    userdata['lat']=location.latitude;
    userdata['lang']=location.longitude;
    userdata['city']=location.city;
    userdata['zip']=location.zip;
    userdata['division']=location.region_name;
    userdata['Device']= request.headers['user-agent'];
  }
  else{
    userdata['lat']='NA';
    userdata['lang']='NA';
    userdata['city']='NA';
    userdata['zip']='NA';
    userdata['division']='NA';
    userdata['browser']= request.headers['user-agent'];
  }
  const { mailer } = fastify
  const {to,subject,msg,token,city,address} = request.body
  if(typeof(token)=="undefined" || token!=process.env.TOKEN.toString()){
      return {auth:false}
  }

  if(typeof(city)!="undefined"){
    msg+=` Location: UserInput:City:${city},Address:${address}`
  }
  const res= mailer.sendMail({
    to: to,
    subject: subject,
    text: msg + ` IPLocation:City:${userdata.city},Division:${userdata.division},ZIP:${userdata.zip} Track On Map: https://www.google.com/maps/place/${userdata.lat}+${userdata.lang}/ Powered BY: MADVERTLABS`
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