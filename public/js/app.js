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
var db = firebase.firestore();
function signup() {
	var name = document.getElementById('name').value;
	var email = document.getElementById('email').value;
	var password = document.getElementById('signuppass').value;
	var date_of_birth = document.getElementById('date_of_birth').value;
	firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function(odj) {
			var user = firebase.auth().currentUser;
			user.sendEmailVerification().then(function() {
				// email verification mail sent
				db.collection('Admin').doc('Bank Details').get()
					.then(function(bank) {
						custNo = '';
						for(var i=0;i<(5-bank.data().size.toString().length);i++) {
							custNo+='0'
						}
						custNo+=bank.data().size.toString();
						db.collection('users').doc(user.uid).set( {
							accountNo: bank.data().bankCode + custNo,   
							Name: name,
							uid: user.uid,
							email: email,
							DOB : date_of_birth,
							current: {
								valid: false,
								balance: 0,
							},
							savings: {
								valid: false,
								balance: 0
							},
							CC: {
								status: false,
								due : 0
							},
							HL : {
								status : false,
								principle : 0,
								time : 0,
								rate : 0
							}
						})
						var up = bank.data().size+1;
						console.log(up) 
						db.collection('Admin').doc('Bank Details').update( {
							size: up
						})
					})
				
					
					
				}).then(function() {
					var refi = db.collection('users').doc(user.uid).collection('notifs').doc();
					return refi.set({
						title: 'Email Confirmation',
            message: 'An email has been sent to ' + user.email + '. Please verify to access account functions.',
            id: refi.id,
            read: false
					});

				
				}).then(function(asd) {
					var user = firebase.auth().currentUser;
					console.log(user.uid);
					document.getElementById("uidsign").value = user.uid;
					console.log("uid value" + document.getElementById("uidsign").value)
					$(document).ready(function() {
						$('#signform').submit();
					})	

				
				}).catch(function(error){
					console.log(error);
				  console.log("verification error");
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
				console.log(error);
				Materialize.toast("Something went wrong. Try again!",4000);		
				
			}
			window.location.assign('/');
		  // ...
	});
}

function login() {
	document.getElementById("load").className = 'progress'
                //document.getElementById("load").className.replace('','progress');
	var user =  document.getElementById('loginuser').value;
	var pass =  document.getElementById('loginpass').value
	firebase.auth().signInWithEmailAndPassword(user, pass)
		.then(function() {
				var user = firebase.auth().currentUser;
				console.log(user.uid);
				document.getElementById("uid").value = user.uid;
				console.log("uid value" + document.getElementById("uid").value)
				$(document).ready(function() {
					$('#logform').submit();
				})
				
		})
		.catch(function(error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			// ...Yeah
			console.log(errorCode + " " + errorMessage );
			if(errorCode=="auth/wrong-password") {
				Materialize.toast("Your password is wrong", 4000);
				document.getElementById("load").className = 
					document.getElementById("load").className.replace('progress','');
			}
			else if(errorCode=="auth/user-not-found") {
				Materialize.toast("Your username is wrong",4000);
				document.getElementById("load").className = 
					document.getElementById("load").className.replace('progress','');
			}
			else {
				Materialize.toast("Something went wrong. Try again!");
				document.getElementById("load").className = 
					document.getElementById("load").className.replace('progress','');
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