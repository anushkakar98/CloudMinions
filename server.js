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
        { title: 'an event', id: 1, description: 'something really cool', location: "Bangalore" },
        { title: 'another event', id: 2, description: 'something even cooler', location: "Hyderabad" }
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
    firestore.collection("Events").doc(id).delete();
    console.log("delete func");
};


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
                console.log(ret);
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



// Adds an event - in a real solution, this would insert into a cloud datastore.
// Currently this simply adds an event to the mock array in memory
// this will produce unexpected behavior in a stateless kubernetes cluster. 
app.post('/event', (req, res) => {
    // create a new object from the json data and add an id
   // create a new object from the json data and add an id
    const ev = { 
        title: req.body.title, 
        description: req.body.description,
        location: req.body.location
     }
// this will create the Events collection if it does not exist
    firestore.collection("Events").add(ev).then(ret => {
        getEvents(req, res);
    });

});

app.delete('/event', (req, res) => {
    // create a new object from the json data and add an id
   // create a new object from the json data and add an id
    
    // id: req.body.id;
    // deleteEvents(req, res, id);
    deleteEvents(req, res, "uhZFLxvPbIpi4ys7uN4b");
    // console.log(id);
   // console.log(req.body.id);
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