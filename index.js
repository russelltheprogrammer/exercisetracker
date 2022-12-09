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

const convertDate = (date) => !date ? new Date().toDateString() : new Date(date).toDateString() === "Invalid Date" ? new Date().toDateString() : new Date(date).toDateString();

//post exercise form data to /api/users/:id/exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = convertDate(req.body.date);
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
app.get('/api/users/:_id/logs',  (req, res) => {
 const userId = req.params._id;
 let numberOfExercises = 0;
//  const { from: fromDate, to: toDate } = req.query;
 const fromDate = new Date(req.query.from).valueOf();
 const toDate = new Date(req.query.to).valueOf();
 const limit = req.query.limit ? parseInt(req.query.limit) : 0;
 console.log(fromDate, toDate);
  Username.findById(userId, (err, userFound) => {
    if(err) {
      return console.log(err);
    }
    else if (!userFound) {
      return res.json({ message: "This user does not exist. Please add a new user to get an id."});
    }
    else {
      Exercise
        .find({ userId: userId })
        .limit(limit)
        .select({ userId: 0, _id: 0})
        .exec((err2, exercisesFound) => {
          if(err2) {
            return console.log(err2);
          }
          else if(!exercisesFound) {
            return res.json({ message: "No exercises found for this user. Please add exercises."});
          }
          else {
            numberOfExercises = exercisesFound.length;
            console.log("1985-07-15" >= fromDate);
            console.log("2010-06-15" <= toDate);
            if(fromDate && toDate) {
              exercisesFound.filter((valueWithinDateRange) => {
                let dateToCompare = new Date(valueWithinDateRange.date).valueOf();
                if(dateToCompare >= fromDate && dateToCompare <= toDate) {
                  return valueWithinDateRange;
                }
              });
            }
              return res.json({
                username: userFound.username,
                count: numberOfExercises,
                _id: userId,
                log: exercisesFound
            });
          }
        });
    }
  });
}); 

// test link /api/users/63921b295f5e99b88b4e4783/logs
// test link 2 /api/users/63921b295f5e99b88b4e4783/logs?from=1985-01-01&to=2010-06-15&limit=5

const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
