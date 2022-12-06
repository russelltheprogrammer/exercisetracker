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
  username: { type: String },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String },
  userId: { type: String }
}, { versionKey: false });

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

const convertDate = (date) => !date ? new Date().toDateString() : new Date(date).toDateString() === "Invalid Date" ? new Date().toDateString() : new Date(date).toDateString();

//post exercise form data to /api/users/:id/exercises
app.post('/api/users/:_id/exercises', async (req, res, next) => {
  const userId = req.body[":_id"];
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  date = convertDate(req.body.date);
  const userFound = await Username.findById(userId);
  if (!userFound) {
    res.json({ message: "This user does not exist. Please add a new user to get an id."})
  }
  const newExercise = await new Exercise({
    username: userFound.username,
    description: description,
    duration: duration,
    date: date,
    userId: userId
  });
  newExercise.save((err, exercise) => {
    if(err) {
      return console.error(err);
    }
    return exercise;
  });
  res.json({
    username: userFound.username,
    description: description,
    duration: duration,
    date: date,
    _id: userId
  });
});

//get full excercise log of any user by id
app.get('/api/users/:_id/logs', async (req, res, next) => {
 const userId = req.params._id;

 const exercisesFound = await Exercise.find({ userId: userId })
  .select({ username: 0, userId: 0, _id: 0})
  .exec((err, dataFound) => {
    if(err) {
      return console.error(err);
    }
    return dataFound;
  });

 const numberOfExercises = exercisesFound.length;
 res.json({
  username: "",
  count: numberOfExercises,
  _id: userId,
  log: exercisesFound
 });
}); 

// test link /api/users/63891c44ca8e2c85b6c5c4f6/logs

const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
