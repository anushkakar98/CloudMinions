'use strict';

// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// converts content in the request into parameter req.body
// https://www.npmjs.com/package/body-parser
const bodyParser = require('body-parser');

// bring in firestore
const Firestore = require("@google-cloud/firestore");

// initialize Firestore and set project id from env var
const firestore = new Firestore(
    {
        projectId: process.env.GOOGLE_CLOUD_PROJECT
    }
);


// create the server
const app = express();

// the backend server will parse json, not a form request
app.use(bodyParser.json());

// mock events data - for a real solution this data should be coming 
// from a cloud data store
const mockEvents = {
    events: [
        { title: 'an event', id: 1, description: 'something really cool', location: "Bangalore", like: 0 },
        { title: 'another event', id: 2, description: 'something even cooler', location: "Hyderabad", like: 0 }
    ]
};




// health endpoint - returns an empty array
app.get('/', (req, res) => {
    res.json([]);
});

// version endpoint to provide easy convient method to demonstrating tests pass/fail
app.get('/version', (req, res) => {
    res.json({ version: '1.0.0' });
});


function deleteEvents(req, res, id) {
    firestore.collection("Events").doc(id).delete()
    .catch((err) => {
            console.error('Error deleteing event', err);
            res.json(mockEvents);
        });
    console.log("delete func");
};

function addLike(req, res, id){
    
    let evRef=firestore.collection("Events").doc(id);
    let getDoc= evRef.get()
       .then(el => {
           
            if (!el.exists) {
                console.log('No such document!');
                } else {
                console.log('Event :', el.data().like);
                 firestore.collection("Events").doc(id)
                    .update({
                        "like": el.data().like + 1 
                    });
                }
            })
            .catch(err => {
                console.log('Error getting document', err);
            });

}

function getEvent(req, res, id){
    
    let evRef=firestore.collection("Events").doc(id);
    let getDoc= evRef.get()
       .then(el => {
           
            if (!el.exists) {
                console.log('No such Event!');
                } else {                
                 let ev= el.data();
                 ev.id=id;
                 console.log("$$$$$$$$$$$$ event : ",ev);
                 res.json(ev);
                }
            })
            .catch(err => {
                console.log('Error getting event', err);
            });

}

function getEvents(req, res) {
    firestore.collection("Events").get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                const ret = { events: []};
                snapshot.docs.forEach(element => {
                    //get data
                    const el = element.data();
                    //get internal firestore id and assign to object
                    el.id = element.id;
                    //add object to array
                    ret.events.push(el);
                }, this);
                //console.log(ret);
                res.json(ret);
            } else {
                 res.json(mockEvents);
            }
        })
        .catch((err) => {
            console.error('Error getting events', err);
            res.json(mockEvents);
        });
};


// mock events endpoint. this would be replaced by a call to a datastore
// if you went on to develop this as a real application.
app.get('/events', (req, res) => {
     getEvents(req, res);
     console.log("get events");
});

app.post('/event', (req, res) => {
    // create a new object from the json data and add an id
   // create a new object from the json data and add an id
    const ev = { 
        title: req.body.title, 
        description: req.body.description,
        location: req.body.location,
        like: parseInt(req.body.like)
     }

// this will create the Events collection if it does not exist
    firestore.collection("Events").add(ev).then(ret => {
        getEvents(req, res);
    });

});

app.post('/getEvent', (req, res) => {
    
    console.log(req.body);
    
     getEvent(req, res, req.body.id);
     console.log("get event");
});


// Adds an event - in a real solution, this would insert into a cloud datastore.
// Currently this simply adds an event to the mock array in memory
// this will produce unexpected behavior in a stateless kubernetes cluster. 
app.post('/updateEvent', (req, res) => {
    // create a new object from the json data and add an id
   // create a new object from the json data and add an id
    console.log("@@@@@@@@@@@@@@");
    console.log(req.body);

    firestore.collection("Events").doc(req.body.id)
                    .update({
                        "title": req.body.title,
                        "description": req.body.description,
                        "location":req.body.location,
                        "like": req.body.like
                    });

    // let evRef=firestore.collection("Events").doc(req.body.id);
    // let getDoc= evRef.get()
    //    .then(el => {
           
    //         if (!el.exists) {
    //             console.log('No such document!');
    //             } else {
    //             console.log('Event :', el.data());
                 
    //             }
    //         })
    //         .catch(err => {
    //             console.log('Error getting document', err);
    //         });




    res.redirect('/');
});

app.post('/delEvent', (req, res) => { 
    
     deleteEvents(req, res, req.body.id);

    res.redirect('/');
    
});

app.post('/like', (req, res) => { 
    
    addLike(req,res,req.body.id);
    
    res.redirect('/');
    
});



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = 8082;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;