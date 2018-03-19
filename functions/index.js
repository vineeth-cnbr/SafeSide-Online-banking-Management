var express = require('express');
var app = express();
const path = require('path');
const publicPath = path.join(__dirname,'..','/public'); 
const admin = require("firebase-admin");
//var functions = require("firebase-functions");
//var firebase = require('firebase');
var serviceAccount = require('./secret.json');
admin.initializeApp( {
	credential: admin.credential.cert(serviceAccount)
})
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.set('view engine', 'ejs');
app.use(cookieSession({
  keys: ['ThisIsSecret'],
  // Cookie Options 
  maxAge: 24 * 60 * 60 * 1000 // 24 hours 
}))

var db = admin.firestore();


app.get("/hi", (req, res) => {

  res.send("hello");

});

app.post("/login", (req, res) => {
	console.log("uid: "+req.body.uid);
	req.session.uid = req.body.uid;
  res.redirect("/dashboard")
})

app.get('/dashboard', (req, res) => { 
	res.render('settings.ejs');
});

app.get('/notif', (req, res) => {
	db.collection('users').doc(req.session.uid).get()
		.then((doc) => {
			if(doc.data().notifs) {
				res.send(doc.data().notifs);
			}
			else {
				res.send("No response");
			}
		})
})

app.post('/messagedelete', (req, res)=> {
	var notifNo = req.body.notifNo; 
	db.collection('users').doc(req.session.uid).collection('notifs').doc(req.body.notifNo).delete()
		.then(()=> {
			res.send("success");
		})
		.catch((err) => {
			res.send(err);
		})
		/*.then((doc) => {
			var notifs = doc.data().notifs;
			notifs.splice(notifNo,1);
			db.collection('users').doc(req.session.uid).update({
				notifs: notifs
			}).then(()=> {
				res.send("success");
			}).catch((err)=>{
				res.send(err);
			})*/
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
});
});


app.post("/signupsubmit", function (req,res) {

	admin.auth().createUser({
	name: req.body.name,
	email: req.body.email,
	emailVerified: false,
	password: req.body.pass
	/*displayName: "John Doe",
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
	firebase.auth().signInWithEmailAndPassword(email, password)
	.then(function (argument) {
		console.log(argument)
	})


	.catch(function(error) {
  		// Handle Errors here. 
  		var errorCode = error.code;
  		var errorMessage = error.message;
  		// ...
	});
});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions


app.listen(8000, function(){

	console.log('listening at :'+ '8000')
});

