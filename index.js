const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
// add these two lines to parse JSON and URL-encoded data
// in order to handle form submissions
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// create new user with submitted username and generate a unique ID
// in this case, each time u submit name, a new user is created even if the name is the same
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const userId = new Date().getTime().toString(16) + Math.random().toString(16).slice(2, 10);
  const user = { username: username, _id: userId };
  res.status(201).json(user);
})


app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }
  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  const exercise = {
    _id: userId,  
    description: description,
    duration: parseInt(duration, 10),
    date: exerciseDate.toISOString().split('T')[0] // format date as yyyy-mm-dd
  };
  res.status(201).json(exercise);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
