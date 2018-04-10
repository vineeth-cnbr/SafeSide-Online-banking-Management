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

function isLoggedIn(req, res, next) {
	if(req.session.user) {
		db.collection('users').doc(req.session.user.uid).get().then(function(user) {
			req.session.user = user.data();
			console.log(user.data().HL.date);
			console.log("User refreshed")
			next();
		})
	}else {
		res.send("please login to continue");
	}
}


app.get("/hi", (req, res) => {

  res.send("hello");

});

app.post("/login", (req, res) => {
	console.log("uid: "+req.body.uid);
	db.collection('users').doc(req.body.uid).get().then(function(user) {
		req.session.user = user.data();
		req.session.uid = req.body.uid;
		console.log("Session data: ", req.session.user, req.session.user)
  		res.redirect("/dashboard")
	})
	
})

app.get("/logout", isLoggedIn, (req, res) => {
	req.session.user = null
	res.redirect('/');
})

app.get('/dashboard',isLoggedIn, (req, res) => { 
	res.render('settings.ejs');
});

app.get('/savings', isLoggedIn, (req, res) => { 
	res.render('savings.ejs');
});

app.get('/credit', isLoggedIn, (req, res) => { 
	db.collection('users').doc(req.session.user.uid).get().then(function(user) {
		res.render('creditcard.ejs',{data:user.data()});
	})
	
});


app.get('/current', isLoggedIn, (req, res) => { 
	res.render('current.ejs');
});

app.post('/savingsbalance', (req,res) => {
	db.collection('users').doc(req.session.uid).get().then(function(users) {
		req.session.users = users.data();
		console.log(req.session.users);
		var oldbalance = users.data().savings.balance;
		console.log(oldbalance);
		var newBalance = Number(oldbalance) + Number(req.body.amount)
					console.log(newBalance);
					var now = new Date();
					var notifRef = db.collection('users').doc(users.data().uid).collection('notifs').doc();
					var transRef = db.collection('users').doc(users.data().uid).collection('transactions').doc()
					return Promise.all([db.collection('users').doc(users.data().uid).update({
						savings: {
							balance: newBalance,
							valid: true
						}
					}),notifRef.set({
						date: now,
						id: notifRef.id,
						read: false,
						title: '₹'+req.body.amount + ' deposit',
						message: 'You deposited ₹'+req.body.amount + ' into your savings account'
					}),transRef.set({
						date: now,
						title: '₹'+req.body.amount + ' deposit',
						message: 'You deposited ₹'+req.body.amount + ' into your savings account'
					})]);
	}).then(function() {
		res.redirect('/savings');
	}).catch(function(err) {
		console.log(err);
		res.send(err);
	})
});

app.post('/creditpayment' ,isLoggedIn, (req,res) =>{
	var accType = Number(req.body.typeAcc);
	var flag = false;
	if(Number(req.session.user.CC.bill) <= 0 ) {
		res.send("You cannot make a payment for zero balance.Go <a href=\"/credit\"> back</a>")
	}else {

	
	var duedate;

	//var bill = 60; //vineet this I have assumed
	db.collection('users').doc(req.session.uid).get().then(function(users) {
		var bill = users.data().CC.bill;
		duedate = users.data().CC.duedate;
		console.log(duedate);
		if (accType == 1) {
			var bal = users.data().savings.balance;
		}else  {
			var bal = users.data().current.balance;
		}
		console.log(bal);
		if(bill > bal){
			res.send("You do not have sufficient balance in your account. Please go <a href=\"/credit\"> back</a> and add cash into your account to continue.");
			flag=true;
			return
		}
		else{
			var newbal = bal - bill ; 
			if (accType == 1) {
				return db.collection('users').doc(users.data().uid).update({
					savings: {
						balance: newbal
					}
				})
			}else  {
				return db.collection('users').doc(users.data().uid).update({
					current: {
						balance: newbal
					}
				})
			}
		}

	}).then(function() {
		if(!flag) {
		var now = new Date();
		console.log(duedate);
		var nextMonth = new Date((new Date(duedate.getFullYear(), duedate.getMonth()+2,1))-1)
		return db.collection('users').doc(req.session.user.uid).update( {
			CC: {
				duedate: nextMonth,
				bill:0
			}
		})
		}
		
	}).then(function() {
		res.redirect('/credit');
	}).catch(function(err) {
		console.log(err);
		res.send(err);
	})
}
});

app.post('/currentbalance', (req,res) => {
	db.collection('users').doc(req.session.uid).get().then(function(users) {
		req.session.users = users.data();
		console.log(req.session.users);
		var oldbalance = users.data().current.balance;
		console.log(oldbalance);
		var newBalance = Number(oldbalance) + Number(req.body.amount)
					console.log(newBalance);
					var now  = new Date();
					var notifRef = db.collection('users').doc(users.data().uid).collection('notifs').doc();
					var transRef = db.collection('users').doc(users.data().uid).collection('transactions').doc()
					return Promise.all([db.collection('users').doc(users.data().uid).update({
						current: {
							balance: newBalance,
							valid: true
						}
					}),notifRef.set({
						date: now,
						id: notifRef.id,
						read: false,
						title: '₹'+req.body.amount + ' deposit',
						message: 'You deposited ₹'+req.body.amount + ' into your current account'
					}),transRef.set({
						date: now,
						title: '₹'+req.body.amount + ' deposit',
						message: 'You deposited ₹'+req.body.amount + ' into your current account'
					})]);
	}).then(function() {
		res.redirect('/current');
	}).catch(function(err) {
		console.log(err);
		res.send(err);
	})
});

app.post('/transferfund', (req,res) => {
	var flag=false;
	console.log(req.body.typeAcc,typeof(req.body.typeAcc));
	var accType = Number(req.body.typeAcc);
	var acno = req.body.acno;
	var amount = req.body.amount;
	console.log(accType,typeof(accType));
	db.collection('users').doc(req.session.uid).get().then(function(user) {
		req.session.user = user.data();
		if(accType = 1) {
			if(user.data().savings.balance>=req.body.amount && accType!=3) {
				
				return ;
			}else {
				flag=true;
				res.send("You do not have sufficient balance in your account. Please go <a href=\"/transfer\"> back</a> and add cash into your account to continue.")
				return
			}
		}else {
			if(user.data().current.balance>=req.body.amount) {
				return ;
			}else {
				res.send("You do not have sufficient balance in your account. Please go <a href=\"/transfer\"> back</a> and add cash into your account to continue.")
				flag=true;
				return ;
			}
		}
	}).then(function() {
		if(!flag) {
			return db.collection('users').get()
		}else {
			return;
		}
	}).then(function(users) {
		if(!flag) {
		console.log("All Users: ", users);
			users.forEach(function(user) {
				console.log("account Number,& acno",user.data().accountNo,req.body.acno)
				if(user.data().accountNo == req.body.acno) {
					console.log("Correct Account Number User", user.data());
					if (accType == 1) {
						var oldbalance = user.data().savings.balance;
					}else  {
						var oldbalance = user.data().current.balance;
					}
					console.log("Old Balance and body amount",oldbalance, req.body.amount)
					var newBalance = Number(oldbalance) + Number(req.body.amount)
					console.log(newBalance);
					if (accType == 1) {
						return db.collection('users').doc(user.data().uid).update({
							savings: {
								balance: newBalance
							}
						})	
					}else if(accType == 2) {
						return db.collection('users').doc(user.data().uid).update({
							current: {
								balance: newBalance
							}
						})	
					}else {
						return db.collection('users').doc(user.data().uid).update({
							savings: {
								balance: newBalance
							}
						})
					}
						
				}	
			})
		}else {
			return;
		}
	}).then(function() {
		if(!flag) {
		var accType = Number(req.body.typeAcc);	
		console.log("updated balance",accType);
		if (accType == 1) {
			var oldBalance = req.session.user.savings.balance;
			var newBalance = oldBalance - req.body.amount;
			return db.collection('users').doc(req.session.user.uid).update({
				savings: {
					balance: newBalance
				}
			})
		}else if(accType == 2)  {
			var oldBalance = req.session.user.current.balance;
			var newBalance = oldBalance - req.body.amount;
			return db.collection('users').doc(req.session.user.uid).update({
				current: {
					balance: newBalance
				}
			})
		}else {
			console.log("credit card add bill")
			
			return db.collection('users').doc(req.session.user.uid).update({
				CC: {
					bill: Number(req.session.user.CC.bill) + Number(req.body.amount),
					duedate: req.session.user.CC.duedate
				}
			})
		}
		
		}else {
			return;
		}
	}).then(function() {
		//added to transactions collecions of user 
		console.log("Transaction added");
		if(!flag) {
		var now = new Date();
		
		var notifRef = db.collection('users').doc(req.session.user.uid).collection('notifs').doc(now.getTime().toString());
		console.log(now.toDateString());
		return Promise.all([db.collection('users').doc(req.session.user.uid).collection('transactions').doc(now.getTime().toString()).set({
			date: now,
			title: '₹'+amount + ' paid to ' + acno,
			message: "Transaction of ₹" + amount + ' done to payee with account number ' + acno + ' on ' + now.toDateString(),

			 
		}),notifRef.set({
			date: now,
			id: notifRef.id,
			title: amount + 'paid to ' + acno,
			message: "Transaction of ₹" + amount + ' done to payee with account number ' + acno + ' on ' + now.toDateString(),
			read: false
		})]);
		
		}else {
			return ;
		}
	}).then(function() {
		if(!flag) {
		//added transactions collections of payee
		console.log("Querying users")
		var citiesRef = db.collection('users');
		var queryRef = citiesRef.where('accountNo', '==', acno);
		return queryRef.get()
		}else {
			return;
		}
	
	}).then(function(obj) {
		if(!flag) {
		obj.forEach(function(payee) {
			console.log("payee found",payee.data());
			var now = new Date();
			var notifRef = db.collection('users').doc(payee.data().uid).collection('notifs').doc();
			return Promise.all([db.collection('users').doc(payee.data().uid).collection('transactions').doc().set({
				date: now,
				title: amount + ' Recieved from ' + req.session.user.accountNo,
				message: "Transaction of ₹" + amount + ' Recieved from ' + req.session.user.name
			}),notifRef.set({
				id: notifRef.id,
				read: false,
				title: amount + ' Recieved from ' + req.session.user.accountNo,
				message: "Transaction of ₹" + amount + ' Recieved from ' + req.session.user.name
			})]) ;
		});
		}else {
		return
		}
	return;
		
	}).then(function() {
		res.redirect('/transfer');
	}).catch(function(err) {
		console.log(err);
		res.send(err);
	})
});

app.get('/transfer',isLoggedIn, (req, res) => { 
	db.collection('users').doc(req.session.user.uid).collection('payees').get()
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
				res.render('transfer',{result: [{payeename:	"No payees"}]}); // no notifications inside notifs
		}
})
});

app.get("/transactions", isLoggedIn, (req, res) => {
	var trans = []
	var i=0;
	if(req.query.f=='all') {
		db.collection('users').doc(req.session.user.uid).collection('transactions').orderBy('date','desc').get().then(function(me) {
			var size = me.size;
			if(me.size ==0) {
				return
			}
			me.forEach(function(m) {
				trans.push(m.data());
				i++;
				if(i==size) {
					return
				}
			})
		}).then(function() {
			res.render('transactions',{data: trans})
		});	
	}else if(req.query.f=='month') {
		var trans =[]
		var query = db.collection('users').doc(req.session.user.uid).collection('transactions').orderBy('date','desc').get().then(function(t) {
			var size = t.size;
			i=0;
			
			var now = new Date();
			if(size==0) {
				return
			}
			t.forEach(function(tr) {	
				i++;
				if(tr.data().date.getMonth()==now.getMonth()) {
					trans.push(tr.data());
				}
				if(i==size) {
					return
				}
			})
		}).then(function() {
			res.render('transactions',{data:trans});
		}).catch(function(err) {
			res.send(err.toString());
		})
	}else if(req.query.from!='undefined'){
		var fromDate = new Date(req.query.from);
		var toDate = new Date(req.query.to);
		console.log("Date Range: ",fromDate,'-',toDate);
		arr = [];
		var transactions = db.collection('users').doc(req.session.user.uid).collection('transactions')
		transactions.where('date','>=',fromDate).where('date','>=',toDate).orderBy('date','desc').get().then(function(trans) {
			var size = trans.size;
			i=0;
			if(trans.size ==0) {
				return 
			}
			trans.forEach(function(m) {
				arr.push(m.data());
				i++;
				if(i==size) {
					return
				}
			})
		}).then(function() {
			res.render('transactions',{data: arr});
		});
	
	}else {
		var transactions = db.collection('users').doc(req.session.user.uid).collection('transactions')
		transactions.orderBy('date','desc').limit(10).get().then(function(trans) {
			console.log(trans);
			var size = trans.size;
			i=0;
			transactions = []
			if(trans.size ==0) {
				return 
			}
			trans.forEach(function(m) {
				transactions.push(m.data());
				i++;
				if(i==size) {
					return
				}
			})
		}).then(function() {
			res.render('transactions',{data: transactions})
		}).catch(function(err) {
			console.log(err);	
			res.send(err);
		});
	}
	
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

app.post("/deletepayee", isLoggedIn, (req,res) => {
	console.log(req.body.paydel2)
	
	db.collection('users').doc(req.session.user.uid).collection('payees').doc(req.body.paydel2).delete().then(function() {
		res.redirect('/transfer')
	})
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

app.get('/HL',isLoggedIn, (req,res)=>{

	console.log(req.session.uid);
	db.collection('users').doc(req.session.user.uid).get()
	.then((data) => {
		var data1 = data.data().HL.status;
		console.log(data1);
		console.log("Inside .then");
		if(data1 == null){
			data1 = {
				status: false,
				principle : 0,
				time : 0,
				rate : 0
			}
		}else {
			data1 = data.data().HL;
		}
		res.render("HomeLoan.ejs", {data1});
	})
	.catch((err) =>{console.log(err);res.send(err);})
})

app.post('/HLapply', (req,res)=>{
	var date  = new Date();
    var todayMonth = date.getMonth();
    var dueDate = new Date((new Date(date.getFullYear(), todayMonth+1,1))-1)
	var principle = Number(req.body.principle);
	var time = Number(req.body.time);
	var rate = Number(req.body.rate);
	console.log("The rate : ",rate);
	var totalAmount = principle + rate*principle;
	var monthlydue = totalAmount/time;
	db.collection('users').doc(req.session.uid).update({
		HL : {
			status : true,
			principle : principle,
			time : time,
			rate : rate,
			due : monthlydue,
			total : totalAmount,
			date : dueDate
		}
	})
	.then(()=>{
		res.redirect('/HL');
	})
})

app.post("/HLpayment",isLoggedIn, (req,res)=>{
	var due = req.body.due;
	var date  = req.session.user.HL.date;
    var todayMonth = date.getMonth();
    var dueDate = new Date((new Date(date.getFullYear(), todayMonth+2,1))-1)
	var docRef = db.collection('users').doc(req.session.uid);
	var newBalance = Number(0);
	var balance = docRef.get()
	.then((data) => {
		
		
			console.log(due);
			if(Number(req.body.opt) == 2){
				if(Number(data.data().current.balance)>=Number(req.body.due)) {
					newBalance = data.data().current.balance;
					newBalance = newBalance - req.body.due;
					console.log(newBalance);
					docRef.update({
						current : {
							balance:newBalance,
							valid:true
						},
						HL : {
							status : true,
							principle : data.data().HL.principle,
							time : data.data().HL.time,
							rate : data.data().HL.rate,
							due : data.data().HL.due,
							total : data.data().HL.total,
							date : dueDate
						}
					}).then(()=>{res.redirect('/HL')})
				}else {
					res.send("You do not have sufficient balance in your account. Please go <a href=\"/transfer\"> back</a> and add cash into your account to continue.")
				}
		}
		else if(Number(req.body.opt) == 1){
			if(Number(data.data().savings.balance)>=Number(req.body.due)) {
				newBalance = data.data().savings.balance;
				newBalance = newBalance - req.body.due;
				console.log(newBalance);
				docRef.update({
					savings : {
						balance:newBalance
					},
					HL : {
						status : true,
						principle : data.data().HL.principle,
						time : data.data().HL.time,
						rate : data.data().HL.rate,
						due : data.data().HL.due,
						total : data.data().HL.total,
						date : dueDate
					}
				}).then(()=>{res.redirect('/HL')})
			}
			else {
				res.send("You do not have sufficient balance in your account. Please go <a href=\"/HL\"> back</a> and add cash into your account to continue.")
			}
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
	var now = new Date();
	var compRef = db.collection('users').doc(req.session.uid).collection('notifs').doc();
			compRef.set( {
					date: now.getDate().toString(),
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

