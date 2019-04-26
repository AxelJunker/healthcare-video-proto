const https = require('https')
const fs = require('fs')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const controller = require('./controller/controller.js')

const app = express();

app.use(session({secret: 'o_mega_secret'}))
app.use('/', express.static(__dirname + '/view/public'))
app.use(bodyParser.json())

// SSL certs
const options = {
    key: fs.readFileSync(__dirname + '/cert/key.pem'),
    cert: fs.readFileSync(__dirname + '/cert/certificate.pem')
}

// Create https server and run it
const server = https.createServer(options, app)
const port = process.env.PORT || 3000
server.listen(port, function() {

  console.log('Server running on *:' + port)

  controller.init(app)

  if(process.env.NODE_ENV == 'testData') {
    controller.testData(app)
  }
})
