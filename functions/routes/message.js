module.exports = (express, admin, cb) => {
    router = express.Router(),
    path = require('path'),
    app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var db = admin.firestore();

router.post('/messageRead', (req,res) => {
    db.collection('users').doc(req.session.uid).collection('notifs').doc(req.body.id).update({
        read: true
    })
        .then(()=> {
            res.send('success');
        })

});

router.post('/messageUnread', (req,res) => {
    db.collection('users').doc(req.session.uid).collection('notifs').doc(req.body.id).update({
        read: false
    })
        .then(()=> {
            res.send('success');
        })

});

router.get('/addMessage/:message',(req,res) => {
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

router.get('/notif', (req, res) => {
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

router.post('/messagedelete', (req, res)=> {
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

router.post('/regComplaint', (req, res) => {
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

cb(router);
}

