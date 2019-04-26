
let localTracks
let videoConnected

//Get patient
$.getJSON('/user', function(patient) {

  if(patient.patient_id) {

    //Render doc name
    $('.local-user').text('Hej ' + patient.first_name)
    $('.local-user').attr('id', patient.patient_id)

    getBookings()

  } else if(patient.expired){
    alert('Logga in igen')
    window.location.href = '../index.html'
  } else {
    console.log('Fel i userPatient.js getPatient')
  }
})

//Get bookings
function getBookings() {

  $.getJSON('/patientBookings', function(bookings) {

    if(bookings[0]) {

      //Render bookings in bookings table
      bookings.forEach(function(booking) {

        createRow(booking)

      })

      sortTable()

    } else if(bookings.empty) {
      console.log('Inga bokningar')
    } else if(bookings.expired) {
      alert('Logga in igen')
      window.location.href = '../index.html'
    } else if(bookings.err){
      console.log(booknigs.err)
    } else {
      console.log('Error userPatient.js getBookings()')
    }
  })
}

function createRow(booking) {

  const table = document.getElementById('table')

  const row = document.createElement('TR')
  const cellDate = document.createElement('TD')
  const cellTime = document.createElement('TD')
  const cellName = document.createElement('TD')

  row.id = booking.doctor.doctor_id

  const date = new Date(booking.date)
  const dateString = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
  const cellDateText = document.createTextNode(dateString)

  const time = date.getHours() + ':' + ('0'+date.getMinutes()).slice(-2)
  const cellTimeText = document.createTextNode(time)

  const name = booking.doctor.first_name + ' ' + booking.doctor.last_name
  const cellNameText = document.createTextNode(name)

  cellDate.appendChild(cellDateText)
  cellTime.appendChild(cellTimeText)
  cellName.appendChild(cellNameText)

  row.appendChild(cellDate)
  row.appendChild(cellTime)
  row.appendChild(cellName)

  table.appendChild(row)
}

//Make rows clickable
$('#table').on('click', 'tr', function() {
  if($(this).attr('id') != 'tableHeader') {
    if($(this).attr('class') == 'activeRow') {
      $(this).removeClass('activeRow')
    } else {
      $('tr').removeClass('activeRow')
      $(this).addClass('activeRow')
    }
  }
})

//Start video
$('.button_start').on('click', function() {

  const patient_id = $('.local-user').attr('id')
  const doctor_id = $('.activeRow').attr('id')
  let time = $('.activeRow td:nth-child(2)').text()
  let date = $('.activeRow td:nth-child(1)').text()

  if(!videoConnected && doctor_id && patient_id && time && date) {
    date = date.split('/')
    time = time.split(':')
    date = new Date(date[2], date[1] - 1, date[0], time[0], time[1])

    const booking = {
      doctor_id: doctor_id,
      patient_id: patient_id,
      date: date
    }

    $.ajax({
      type: 'POST',
      url: '/booking',
      data: JSON.stringify(booking),
      dataType: 'json',
      contentType: 'application/json',
      success: function(booking) {

        if(booking._id) {

          previewVideo(function(tracks){

            startVideo(booking._id, tracks)

          })

        } else if(booking.empty) {
          console.log('Finns ingen bokning')
        } else if(booking.expired) {
          console.log('Logga in igen (booking)')
        } else if(booking.err){
          console.log(booking.err)
        } else {
          console.log('Error in userPatient.js booking')
        }
      },
      error: function( jqXhr, textStatus, error ){
          console.log(error);
      }
    })
  }

})

//Preview video
$('#button-preview').on('click', function(){

  previewVideo(function(tracks) {

  })

})

function previewVideo(cb) {

  if(!localTracks){
    // Create local video preview
    Twilio.Video.createLocalTracks().then(tracks => {

      localTracks = tracks

      //const localMediaContainer = document.getElementById('local-media')

      tracks.forEach(function(track) {
        $('#local-media').append(track.attach());
      })

      cb(localTracks)
    })

  } else {
    cb(localTracks)
  }
}

function startVideo(booking_id, tracks) {
  // Obtain a token from the server in order to connect to the Room.
  $.getJSON('/twilio', {id: booking_id}, function(data) {

    //Connect to Twilio API with token, room name and tracks
    Twilio.Video.connect(data.token, {name: data.room_id, tracks: tracks}).then(room => {

      videoConnected = true

      $('.waiting').show()

      // Log your Client's LocalParticipant in the Room
      console.log('Connected to room ' + room.name + ' as LocalParticipant ' + room.localParticipant.identity);

      // Connect Participants already connected to the room
      room.participants.forEach(participant => {
        connectRemoteParticipant(participant)
      })

      // Connect new Participants
      room.on('participantConnected', participant => {
        connectRemoteParticipant(participant)
      })

      //When Local Participant disconnects, disconnect both Local & Remote Participant
      room.on('disconnected', room => {
        disconnectParticipants(room)
      })

      //When Remote Participant disconnects, disconnect both Remote & Local Participant
      room.on('participantDisconnected', function(participant) {
        disconnectParticipants(room)
      })

      //Disconnect button
      $('#button-stop').on('click', function(){
        if(videoConnected) {
          videoConnected = false
          room.disconnect()
        }
      })

      // When we are about to transition away from this page, disconnect from the room
      window.addEventListener('beforeunload', function(){
        videoConnected = false
        room.disconnect()
      })

    }).catch(err => {
      console.log(err)
    });
  })
}

// Connect Remote Participant
function connectRemoteParticipant(participant) {

    console.log('Participant ' + participant.identity + ' connected to the Room')

    $('.remote-user').append($('.activeRow td:nth-child(3)').text())
    $('.waiting').hide()

    participant.on('trackAdded', track => {
      document.getElementById('remote-media').appendChild(track.attach())

      if(track.kind == 'video') {
        $('#remote-media video').prop('controls', true)
      }
    })

}

//Disconnect Local Participant & Remote Participant
function disconnectParticipants(room) {

  console.log('Participant disconnected')

  videoConnected = false
  $('.remote-user').text('Patient: ')
  $('.waiting').hide()

  // Disconnect Local Participant
  room.localParticipant.tracks.forEach(track => {

    track.stop()

    const attachedElements = track.detach();
    attachedElements.forEach(element => element.remove());
  })

  //Disconnect Remote Participant
  room.participants.forEach(participant => {

    participant.tracks.forEach(track => {

      const attachedElements = track.detach();
      attachedElements.forEach(element => element.remove());
    })
  })
}

function sortTable() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("table");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[0];
      y = rows[i + 1].getElementsByTagName("TD")[0];
      //check if the two rows should switch place:
      if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch= true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

//Log out
$('.logout').on('click', function(){
  $.getJSON('/logout', function(result) {
    if(result.success) {
      window.location.href = "../index.html"
    } else if(result.err) {
      console.log(result.err)
    }
  })
})
