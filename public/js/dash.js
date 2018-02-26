$(document).ready(function(){
    $(".button-collapse").sideNav();
});

var config = {
    apiKey: "AIzaSyB9SU9h9myh6hg1cQet_5MFB7Dy9-8EPTU",
    authDomain: "safe-side-project.firebaseapp.com",
    databaseURL: "https://safe-side-project.firebaseio.com",
    projectId: "safe-side-project",
    storageBucket: "safe-side-project.appspot.com",
    messagingSenderId: "178491336655"
  };
firebase.initializeApp(config);
  
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();

function signout() {
	firebase.auth().signOut().then(function() {
	  // Sign-out successful. 
	  window.location.assign('/');
	})
	.catch(function(error) {
		// An error happened.
		
	});
}

function changePassword() {
    var user = firebase.auth().currentUser;
    console.log(user.email);
    firebase.auth().sendPasswordResetEmail(user.email).then(function() {
        console.log("Email sent.");
        Materialize.toast("An Email  has been sent to you registered email id. Please visit the link and follow the instructions",10000);
        signout();
      }).catch(function(error) {
        console.log("An error happened.");
    });

    /*
    var op = document.getElementById('oldpassword').value;
    var np = document.getElementById('newpassword').value;
    var cnp = document.getElementById('cnewpassword').value;
    if(np!=cnp) {
        Materialize.toast('New password mismatch',4000);
        return false;
    }
    else  {

    }
    */
}

