var express = require('express');
var app = express();
const path = require('path');
const publicPath = path.join(__dirname,'..','/public'); 
const admin = require("firebase-admin");
//var functions = require("firebase-functions");
//var firebase = require('firebase');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session')
var serviceAccount = require('./secret.json');
admin.initializeApp( {
	credential: admin.credential.cert(serviceAccount)
})
app.use(cookieSession({
  keys: ['ThisIsSecret'],
  // Cookie Options 
  maxAge: 24 * 60 * 60 * 1000 // 24 hours 
}))
var db = admin.firestore();
/*var messageRoutes = require('./routes/message.js')(express, admin, (router) => {
	app.use(router);
});*/
//app.use(messageRoutes.router);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.set('view engine', 'ejs');




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

app.get('/transfer', (req, res) => { 
	db.collection('users').doc(req.session.uid).collection('payees').get()
	.then((payees) => {
		if(!payees.empty){
				var result = [];
				console.log(payees.size)
				var size = payees.size;
				var i=0;
				payees.forEach(payee =>{
								console.log('payee uid' + payee.id);
								result.push(payee.data())
								i++;
								console.log(i);
								if(i==size) {
										console.log(result);
										res.render('transfer',{result:result});	
								}
								console.log('inside QS')
				})
				
		}
		else{
				console.log("No payees added. Yet.")
				res.render('transfer',{result: ["No payees"]}); // no notifications inside notifs
		}
})
});

app.post("/addpayee", function(req, res) {
	var payeeDetails = {
			payeename : req.body.payeename,
			bankname : req.body.bankname,
			branchname : req.body.branchname,
			accnum : req.body.accnum
	}
	console.log(payeeDetails);
	db.collection('users').doc(req.session.uid).collection('payees').doc(req.body.accnum)
			.set(payeeDetails)
				.then(function() {
					res.redirect('/transfer')
				})
});
/*
db.collection('users').doc(req.session.uid).collection('notifs').get()
			.then((querySnapshot) => {
					if(!querySnapshot.empty){
							var result = [];
							console.log(querySnapshot.size)
							var size = querySnapshot.size;
							var i=0;
							querySnapshot.forEach(doc =>{
											console.log('notif uid' + doc.id)
											result.push(doc.data())
											i++;
											console.log(i);
											if(i==size) {
													console.log(result);
													res.send(result);	
											}
											console.log('inside QS')
							})
							
					}
					else{
							console.log("Empty notification bar")
							res.send([]); // no notifications inside notifs
					}
			})
*/

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


app.post('/messageRead', (req,res) => {
	db.collection('users').doc(req.session.uid).collection('notifs').doc(req.body.id).update({
			read: true
	})
			.then(()=> {
					res.send('success');
			})

});

app.post('/messageUnread', (req,res) => {
	db.collection('users').doc(req.session.uid).collection('notifs').doc(req.body.id).update({
			read: false
	})
			.then(()=> {
					res.send('success');
			})

});

app.get('/addMessage/:message',(req,res) => {
	var ref= db.collection('users').doc(req.session.uid).collection('notifs').doc()
	console.log(ref);
	ref.set({
			id: ref.id,
			title: 'random title',
			message: req.params.message,
			read: false
	}).then(()=>{
			res.send("Notification added");
	});
	
})

app.get('/notif', (req, res) => {
	console.log(req.session.uid);
	db.collection('users').doc(req.session.uid).collection('notifs').get()
			.then((querySnapshot) => {
					if(!querySnapshot.empty){
							var result = [];
							console.log(querySnapshot.size)
							var size = querySnapshot.size;
							var i=0;
							querySnapshot.forEach(doc =>{
											console.log('notif uid' + doc.id)
											result.push(doc.data())
											i++;
											console.log(i);
											if(i==size) {
													console.log(result);
													res.send(result);	
											}
											console.log('inside QS')
							})
							
					}
					else{
							console.log("Empty notification bar")
							res.send([]); // no notifications inside notifs
					}
			})
})

app.post('/messagedelete', (req, res)=> {
	var notifNo = req.body.id; 
	db.collection('users').doc(req.session.uid).collection('notifs').doc(notifNo).delete()
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
});

app.post('/regComplaint', (req, res) => {
	//console.log("Submit is working bruh :3")
	var title = req.body.title;
	var body = req.body.body;
	var compRef = db.collection('users').doc(req.session.uid).collection('notifs').doc();
			compRef.set( {
					title: 'Complaint Registered: ' +title,
					message: 'Message body : '+body,
					id: compRef.id,
					read: false
			})
			.then(() => {
					res.redirect('/dashboard');
			})
})


app.listen(8000, function(){

	console.log('listening at :'+ '8000')
});

