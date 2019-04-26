
//Log out user if logged in
$.getJSON('/logout', function(result) {
  if(result.success) {
    initLogin()
  } else if(result.err) {
    console.log(result.err)
  }
})

function initLogin() {
  
  $('#docLoginBtn').on('click', function(){

    let doctor_id = $('#docLoginTxt').val()

    if(doctor_id != '') {

      doctor_id = JSON.stringify({doctor_id: doctor_id})

      getUser(doctor_id)

    } else {
      alert('Skriv in SITH nr')
    }
  })

  $('#pLoginBtn').on('click', function(){

    let patient_id = $('#pLoginTxt').val()

    if(patient_id != '') {

      patient_id = JSON.stringify({patient_id: patient_id})

      getUser(patient_id)

    } else {
      alert('Skriv in personnummer')
    }
  })
}

function getUser(id) {
  $.ajax({
    type: 'POST',
    url: '/login',
    data: id,
    dataType: 'json',
    contentType: 'application/json',
    success: function(login) {
      if(login.doctor) {
        window.location.href = '../user/userDoctor.html'
      } else if(login.patient) {
        window.location.href = '../user/userPatient.html'
      } else if(login.empty){
        console.log('Finns ingen patient med det ID')
      } else if(login.err) {
        console.log('Fel i anrop/databas login.js getUser():')
        console.log(login.err)
      } else {
        console.log('Fel i index.js getUser():')
        console.log(login)
      }
    },
    error: function( jqXhr, textStatus, error ){
        console.log(error);
    }
  })
}
