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

// store all users
const users = [];

// create new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const userId = new Date().getTime().toString(16) + Math.random().toString(16).slice(2, 10);
  const user = {
    username: username,
    _id: userId,
    log: [] // initialize log as an empty array
  };

  // add the new user to our in-memory store
  users.push(user);
  res.status(201).json({ username: user.username, _id: user._id });
});

// return all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// add exercise to user’s log
app.post('/api/users/:_id/exercises', (req, res) => {
  // find the user by _id
  const user = users.find(u => u._id === req.params._id);
  if (!user) {
    return res.status(400).json({ error: 'Unknown userId' });
  }

  const { description, duration, date } = req.body;
  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  const formattedDate = exerciseDate.toDateString();   
  const exercise = {
    description,
    duration: parseInt(duration, 10),
    date: formattedDate
  };
  user.log.push(exercise);             // store log
  // respond with user + new exercise fields
  res.status(201).json({
    _id: user._id,
    username: user.username,
    ...exercise
  });
})

// return logs from the user’s stored array
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id);
  if (!user) {
    return res.status(400).json({ error: 'Unknown userId' });
  }
  let logs = user.log;                 // read stored log
  const { from, to, limit } = req.query;
  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from date format' });
    }
    logs = logs.filter(log => new Date(log.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid to date format' });
    }
    logs = logs.filter(log => new Date(log.date) <= toDate);
  }
  if (limit) {
    const limitNumber = parseInt(limit, 10);
    if (isNaN(limitNumber) || limitNumber < 0) {
      return res.status(400).json({ error: 'Invalid limit' });
    }
    logs = logs.slice(0, limitNumber);
  }

  // ensure each log entry has only description, duration, date
  const responseLogs = logs.map(({ description, duration, date }) => ({
    description,
    duration,
    date
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: user.log.length,  
    log: logs                
  }); 
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
