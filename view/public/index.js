
$('#docLoginBtn').on('click', function(){

  getUser('Doctor')

})

$('#pLoginBtn').on('click', function(){

  getUser('Patient')

})

function getUser(user) {
  $.ajax({
    type: 'POST',
    url: '/login',
    dataType: 'json',
    contentType: 'application/json',
    success: function(session) {
      if(session.patient && user == 'Patient') {
        window.location.href = './user/userPatient.html'
      } else if(session.doctor && user == 'Doctor') {
        window.location.href = './user/userDoctor.html'
      } else if(session.patient && user == 'Doctor') {
        //Patient vill logga in som doktor -> Logga ut patient
        $.getJSON('/logout', function(result) {
          if(result.success) {
            window.location.href = './login/loginDoctor.html'
          } else if(result.err) {
            console.log(result.err)
          }
        })
      } else if(session.doctor && user == 'Patient') {
        //Doktor vill logga in som patient -> Logga ut doktor
        $.getJSON('/logout', function(result) {
          if(result.success) {
            window.location.href = './login/loginPatient.html'
          } else if(result.err) {
            console.log(result.err)
          }
        })
      } else if(session.notSet) {
        window.location.href = './login/login'+user+'.html'
      } else {
        console.log('Error in index.js getUser():')
        console.log(login)
      }
    },
    error: function( jqXhr, textStatus, error ){
        console.log(error);
    }
  })
}
