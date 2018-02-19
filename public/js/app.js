var xhttp = new XMLHttpRequest();
var config = {
    apiKey: "AIzaSyB9SU9h9myh6hg1cQet_5MFB7Dy9-8EPTU",
    authDomain: "safe-side-project.firebaseapp.com",
    databaseURL: "https://safe-side-project.firebaseio.com",
    projectId: "safe-side-project",
    storageBucket: "safe-side-project.appspot.com",
    messagingSenderId: "178491336655"
  };
  firebase.initializeApp(config);


function signup() {
	var email = document.getElementById('email').value;
	var password = document.getElementById('signuppass').value;
	firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function(odj) {
			var user = firebase.auth().currentUser;
			user.sendEmailVerification().then(function() {
					window.location.assign('/dashboard');
					
				}).catch(function(error) {
				  // An error happened.
				});
		})
		.catch(function(error) {
		  // Handle Errors here.
		  var errorMessage = error.message;
		  var errorCode = error.code;
			if(errorCode=="auth/weak-password") {
				Materialize.toast("Your password is weak",4000);	
			}
			else if(errorCode=="auth/email-already-in-use") {
				Materialize.toast("The email is already in use",4000);		
			}
			else {
				Materialize.toast("Something went wrong. Try again!",4000);		
				
			}
		  // ...
	});
}

function login() {
	var user =  document.getElementById('loginuser').value;
	var pass =  document.getElementById('loginpass').value
	firebase.auth().signInWithEmailAndPassword(user, pass)
		.then(function() {
				var user = firebase.auth().currentUser;
				console.log(user.uid);
				xhttp.open("POST", "/login", true);
				xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhttp.send("uid="+user.uid);

				window.location.assign('/dashboard');//s
		})
		.catch(function(error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			// ...Yeah
			console.log(errorCode + " " + errorMessage );
			if(errorCode=="auth/wrong-password") {
				Materialize.toast("Your password is wrong", 4000);
			}
			else if(errorCode=="auth/user-not-found") {
				Materialize.toast("Your username is wrong",4000);
			}
			else {
				Materialize.toast("Something went wrong. Try again!")
			}
	});
}

function signout() {
	firebase.auth().signOut().then(function() {
	  // Sign-out successful. 
	  window.location.assign('/');
	})
	.catch(function(error) {
		// An error happened.
		
	});
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
		console.log("user signed in and user is " + user);
		console.log(user);
  } else {
    console.log("user logged out");

  }
});