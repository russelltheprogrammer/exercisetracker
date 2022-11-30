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
  username: { type: String, required: true }
})

const Username = mongoose.model('Username', usernameSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res, next) => {
  const newUserName = new Username({ username: req.body.username });
  
  await newUserName.save((err) => {
    if(err) return console.error(err);
  });

  res.json( newUserName );
});

app.get('/api/users', (req, res, next) => {
 res.json([req]);
});





const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
