const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
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

const exerciseSchema = new Schema({
  username: { type: String},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String}
},{ versionKey: false });

const Username = mongoose.model('Username', usernameSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

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

//post exercise form data to /api/users/:id/exercises
app.post('/api/users/:_id/exercises', async (req, res, next) => {
  const userId = req.body.id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  const user = await Username.findById(userId, (err, user) => {
    if(err) {
      return console.error(err);
    }
    if(!user){
      return console.log("user does not exist, please create a user first");
    }
    return user;
  });
  const newExercise = await new Exercise({
    username: user,
    description: description,
    duration: duration,
    date: date,
    _id: userId
  });
  newExercise.save((err, exercise) => {
    if(err) {
      return console.error(err);
    }
    res.json(exercise);
  });
  


});

const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
