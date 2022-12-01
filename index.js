const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const { ObjectID, ObjectId } = require('bson');
require('dotenv').config()

const URI = process.env.URI;

mongoose.connect(URI).then(
  () => { console.log("connected to MongoDB database") },
  err => { console.log(err) }
);

const Schema = mongoose.Schema;

const usernameSchema = new Schema({ 
  username: { type: String, required: true },
}, { versionKey: false });

const Username = mongoose.model('Username', usernameSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//post users to /api/users
app.post('/api/users', async (req, res, next) => {
  const newUserName = await new Username({ 
    username: req.body.username
  });
  newUserName.save((err, data) => {
    if(err) return console.error(err);
    res.json( data );
  });
});

//get users from /api/users
app.get('/api/users', (req, res, next) => {
 Username.find({},(err, users) => {
    if(err) {
      return console.error(err);
    }
    res.json(users);
 });
});

const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
