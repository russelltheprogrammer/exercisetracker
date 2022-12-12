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
app.post('/api/users', (req, res) => {
  const newUserName = new Username({ 
    username: req.body.username
  });
  newUserName.save((err, data) => {
    if(err) return console.error(err);
    res.json( data );
  });
});

//get users from /api/users
app.get('/api/users', (req, res) => {
 Username.find({},(err, users) => {
    if(err) {
      return console.error(err);
    }
    res.json(users);
 });
});

const convertDateToStringFormat = (date) => !date ? new Date().toDateString() : new Date(date).toDateString() === "Invalid Date" ? new Date().toDateString() : new Date(date).toDateString();
const convertDateToValueFormat = (date) => new Date(date).valueOf();

//post exercise form data to /api/users/:id/exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = convertDateToStringFormat(req.body.date);
    Username.findById(userId, (err, userFound) => {
      if(err) {
        return console.log(err);
      }
      else if (!userFound) {
        return res.json({ message: "This user does not exist. Please add a new user to get an id."});
      }
      else {
        const newExercise = new Exercise({
          description: description,
          duration: duration,
          date: date,
          userId: userId
        });
        newExercise.save((err2, exercise) => {
          if(err2) {
            return console.log(err2);
          }
          else {
            res.json({
              username: userFound.username,
              description: description,
              duration: duration,
              date: date,
              _id: userId
            });
            return exercise;
          }
        });
      }
    });
  });

//get full excercise log of any user by id
app.get('/api/users/:_id/logs', (req, res) => {
 const userId = req.params._id;
 let numberOfExercises = 0;
 const fromDate = convertDateToValueFormat(req.query.from);
 const toDate = convertDateToValueFormat(req.query.to);
 const limit = req.query.limit ? parseInt(req.query.limit) : 0;
 let returnObj = {
  _id: userId,
  username: "",
  count: numberOfExercises,
  log: ""
 };
  Username.findById(userId, (err, userFound) => {
    if(err) {
      return console.log(err);
    }
    else if (!userFound) {
      return res.json({ message: "This user does not exist. Please add a new user to get an id."});
    }
    else {
      returnObj.username = userFound.username;
      Exercise
        .find({ userId: userId })
        .select({ userId: 0, _id: 0})
        .exec((err2, exercisesFound) => {
          if(err2) {
            return console.log(err2);
          }
          else if(!exercisesFound) {
            return res.json({ message: "No exercises found for this user. Please add exercises."});
          }
          else {
            returnObj.count = exercisesFound.length;
            returnObj.log = exercisesFound;
            if(fromDate && toDate) {
              let exercisesFoundInDateRange = [];
              exercisesFoundInDateRange = exercisesFound.filter((valueWithinDateRange) => {
                let dateToCompare = new Date(valueWithinDateRange.date).valueOf();
                if(dateToCompare >= fromDate && dateToCompare <= toDate) {
                  return valueWithinDateRange;
                }
              });
              if(limit > 0) {
                exercisesFoundInDateRange = exercisesFoundInDateRange.slice(0, limit);
              }
              returnObj.count = exercisesFoundInDateRange.length;
              returnObj.log = exercisesFoundInDateRange;
              return res.json(returnObj);
            }
            else if(limit > 0){
              let exercisesFoundOnlyLimited = [];
              exercisesFoundOnlyLimited = exercisesFound.slice(0, limit);
              returnObj.count = exercisesFoundOnlyLimited.length;
              returnObj.log = exercisesFoundOnlyLimited;
              return res.json(returnObj);
            }
            else {
              return res.json(returnObj);
            }
          }
        });
    }
  });
}); 

const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
