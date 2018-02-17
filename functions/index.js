var express = require('express');
var app = express();
const admin = require("firebase-admin");
var functions = require("firebase-functions");
var firebase = require('firebase');
var bodyParser = require('body-parser');

app.use(express.static( __dirname + '/public'));
app.set('view engine', 'ejs');

//admin.initializeApp(functions.config().firebase

var serviceAccount = require("./secret.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://safe-side-project.firebaseio.com"
});

firebase.initializeApp(firebase.config().firebase)

app.get("/hi", (req, res) => {

    res.send("hello");

})


app.post("/signupsubmit", function (req,res) {
  admin.auth().createUser({
  name: req.body.name,
  email: req.body.email,
  emailVerified: false,
  password: req.body.pass
/* 
  photoURL: "http://www.example.com/12345678/photo.png",
  disabled: false*/
})
  .then(function(userRecord) {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log("Successfully created new user:", userRecord.uid);
  })
  .catch(function(error) {
    console.log("Error creating new user:", error);
  });
})

app.post("/loginsubmit", function (req,res) {
	var uid = "some-uid";
	var username = req.body.email;
	var password = req.body.pass;
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
  		// Handle Errors here. e we need firebase.initializeApp also then

  		var errorCode = error.code;
  		var errorMessage = error.message;
  		// ...
	});
})
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.app = functions.https.onRequest(app);

 
