const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/video')

const Schema = mongoose.Schema

const DoctorSchema = new Schema({
  doctor_id: {
    type: String,
    index: { unique: true },
    required: [true, 'Doctor ID is required']
  },
  first_name: String,
  last_name: String
})

const Doctor = mongoose.model('Doctor', DoctorSchema)

const PatientSchema = new Schema({
  patient_id: {
    type: String,
    index: { unique: true },
    required: [true, 'Patient ID is required']
  },
  first_name: String,
  last_name: String
})

const Patient = mongoose.model('Patient', PatientSchema)

const BookingSchema = new Schema({
  patient_id: {
    type: String,
    required: [true, 'Patient ID is required']
  },
  doctor_id: {
    type: String,
    required: [true, 'Doctor ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  }
})

BookingSchema.index({patient_id: 1, doctor_id: 1, date: 1}, { unique: true })
BookingSchema.index({patient_id: 1, date: 1}, { unique: true })
BookingSchema.index({doctor_id: 1, date: 1}, { unique: true })

const Booking = mongoose.model('Booking', BookingSchema)

module.exports = {
  Doctor:Doctor,
  Patient:Patient,
  Booking:Booking
}
