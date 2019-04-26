require('dotenv').load()
const AccessToken = require('twilio').jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant
const Model = require('../model/model.js')
const _async = require('async')


const init = function(app) {

  app.post('/login', function(req, res) {
    if (req.body.doctor_id) {

      findDoctor(req.body.doctor_id, function(result){
        if(result.doctor){
          req.session.doctor = result.doctor
        }
        res.send(result)
      })

    } else if(req.body.patient_id) {

      findPatient(req.body.patient_id, function(result){
        if(result.patient){
          req.session.patient = result.patient
        }
        res.send(result)
      })

    } else if(req.session.doctor) {
      res.send({doctor: req.session.doctor})
    } else if(req.session.patient) {
      res.send({patient: req.session.patient})
    } else {
      res.send({notSet: true})
    }
  })

  app.get('/logout', function(req, res) {
    if(req.session) {
      req.session.destroy(function(err) {
        if(err) {
          console.log(err)
          res.send({err: err})
        } else {
          res.send({success: true})
        }
      })
    } else {
      res.send({success: true})
    }
  })

  app.get('/user', function(req, res) {

    if(req.session.doctor) {

      res.send(req.session.doctor)

    } else if(req.session.patient) {

      res.send(req.session.patient)

    } else {
      res.send({expired: true})
    }
  })

  app.get('/doctorBookings', function(req, res) {

    if(req.session.doctor) {

      const date = new Date()
      date.setHours(date.getHours() - 1)

      Model.Booking.find({
        doctor_id: req.session.doctor.doctor_id,
        date: {$gt: date} })
        .lean()
        .exec(function(err, bookings) {

          if(bookings.length > 0) {

            _async.each(bookings, function(booking, cb) {

              Model.Patient.findOne({patient_id: booking.patient_id}, function(err, patient) {

                booking.patient = patient
                cb()
              })
            }, function (err) {
              if(err) {
                console.log(err)
                res.send({err: err})
              } else {
                res.send(bookings)
              }
            })
          } else if(err){
            res.send({err: err})
          } else {
            res.send({empty: true})
          }
        })

    } else {
      res.send({expired: true})
    }
  })

  app.get('/patientBookings', function(req, res) {

    if(req.session.patient) {

      const date = new Date()
      date.setHours(date.getHours() - 1)

      Model.Booking.find({
        patient_id: req.session.patient.patient_id,
        date: {$gt: date} })
        .lean()
        .exec(function(err, bookings) {

          if(bookings.length > 0) {

            _async.each(bookings, function(booking, cb) {

              Model.Doctor.findOne({doctor_id: booking.doctor_id}, function(err, doctor) {

                booking.doctor = doctor
                cb()
              })
            }, function (err) {
              if(err) {
                console.log(err)
                res.send({err: err})
              } else {
                res.send(bookings)
              }
            })
          } else if(err){
            res.send({err: err})
          } else {
            res.send({empty: true})
          }
        })

    } else {
      res.send({expired: true})
    }
  })

  app.post('/booking', function(req, res) {

    if(req.session.doctor || req.session.patient) {

      Model.Booking.findOne({
        doctor_id: req.body.doctor_id,
        patient_id: req.body.patient_id,
        date: req.body.date
      }, (err, booking) => {

        if(booking) {
          res.send(booking)
        } else if(err) {
          console.log(err)
          res.send({err: err})
        } else {
          res.send({empty: true})
        }
      })

    } else {
      res.send({expired: true})
    }
  })

  /**
   * Generate an Access Token for a chat application user - it generates a random
   * username for the client requesting a token, and takes a device ID as a query
   * parameter.
   */
  app.get('/twilio', function(req, res) {

    if(req.session.doctor || req.session.patient) {

      if(req.query.id) {
        // Create an access token which we will sign and return to the client,
        // containing the grant we just created.
        var token = new AccessToken(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_API_KEY,
          process.env.TWILIO_API_SECRET
        );

        // Assign user identity and roomID to token
        const user = req.session.doctor || req.session.patient
        token.identity = user.doctor_id || user.patient_id
        token.room_id = req.query.id

        // Grant the access token Twilio Video capabilities.
        var grant = new VideoGrant()
        token.addGrant(grant)

        // Serialize the token to a JWT string and include it in a JSON response.
        res.send({
          identity: token.identity,
          room_id: token.room_id,
          token: token.toJwt()
        });
      } else {
        res.send({err: 'Fel anrop (inget ID)'})
      }

    } else {
      res.send({expired: true})
    }
  })

  function findDoctor(doctor_id, cb){
    Model.Doctor.findOne({doctor_id: doctor_id}, (err, doctor) => {
      if(doctor) {
        cb({doctor: doctor})
      } else if(err){
        console.log(err)
        cb({err: err})
      } else {
        cb({empty: true})
      }
    })
  }

  function findPatient(patient_id, cb) {
    Model.Patient.findOne({patient_id: patient_id}, (err, patient) => {
      if(patient) {
        cb({patient: patient})
      } else if(err){
        console.log(err)
        cb({err: err})
      } else {
        cb({empty: true})
      }
    })
  }

}

const testData = function(app) {

  Model.Doctor.remove({}, function(err) {
     if(err) {
       console.log(err)
     } else {
       Model.Patient.remove({}, function(err) {
          if(err) {
            console.log(err)
          } else {
            Model.Booking.remove({}, function(err) {
               if(err) {
                 console.log(err)
               } else {
                 generateData()
               }
            })
          }
       })
     }
  })

  function generateData() {
    let first_names = ['Axel', 'Alex', 'Edvin', 'Therese']
    let last_names = ['Hellström', 'Mounzer', 'Blomberg', 'Sördal']

    for(let i = 0; i < 4; i++){
      const doctor = new Model.Doctor({
        doctor_id: i + 1,
        first_name: first_names[i],
        last_name: last_names[i]
      }).save()

    }

    first_names = ['Sebastian', 'Mats', 'Kim', 'Odd']
    last_names = ['Lundh', 'Gustafsson', 'Wikbrand', 'Steen']
    let y = 5

    for(let i = 0; i < 4; i++){
      const patient = new Model.Patient({
        patient_id: y,
        first_name: first_names[i],
        last_name: last_names[i]
      }).save()

      y++
    }

    const now = new Date()
    const date1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 00)
    const date2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 15)
    const date3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 30)
    const date4 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 45)

    booking('1', '5', date1)
    booking('1', '6', date2)
    booking('1', '7', date3)
    booking('1', '8', date4)
    booking('2', '5', date2)
    booking('2', '6', date3)
    booking('2', '7', date4)
    booking('2', '8', date1)
    booking('3', '5', date3)
    booking('3', '6', date4)
    booking('3', '7', date1)
    booking('3', '8', date2)
    booking('4', '5', date4)
    booking('4', '6', date1)
    booking('4', '7', date2)
    booking('4', '8', date3)


    function booking(dID, pID, date) {
      new Model.Booking({
        patient_id: pID,
        doctor_id: dID,
        date: date
      }).save(function(err){
        if(err) {
          console.log(err)
        }

      })
    }

    console.log('test data generated')
  }

}

module.exports = {
  init: init,
  testData: testData
}
