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

function changeName() {
    console.log("CHANGE NAME")
    var user = firebase.auth().currentUser;
    var newName = document.getElementById('name').value;
    console.log(newName);
    return db.collection('users').doc(user.uid).update({
        Name:newName
        })
        .then(function(doc) {
            Materialize.toast("Name updated!");
            return true;    
        });
            
}

function deleteUser() {
    var user = firebase.auth().currentUser;
    console.log(user)
    user.delete().then(function() {
        console.log("deleted")
        Materialize.toast("Account Deleted. Logging you out", 10000);
        setTimeout(function() {
            signout();
        },1000);
    }).catch(function(error) {
        console.log(error);
        if(error.code == 'auth/requires-recent-login') {
            Materialize.toast("You need to login again before deleting this account", 1000); 
            setTimeout(function() {
                signout();
            },2000);   
        }
    // An error happened.
    });
}

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      db.collection('users').doc(user.uid).get()
        .then(function(doc) {
            console.log(doc.data().Name);
            document.getElementById('username-nav').innerHTML = 'Hello ' + doc.data().Name;
            document.getElementById('balance-nav').innerHTML = '  Current Balance: ' + doc.data().Balance;
            if(user.emailVerified) {
                document.getElementById('email-verify').innerHTML = 'Your email is verified. You can acess bank account functions';
            }else {
                document.getElementById('email-verify').innerHTML = 'Your email is <b>not</b> verified. You can not access account functions';           
            }
        });
    } else {
        window.location.assign('/');
      // No user is signed in.
    }
  });