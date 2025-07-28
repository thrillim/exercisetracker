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
  const user = { username: username, _id: userId };

  // add the new user to our in-memory store
  users.push(user);

  res.status(201).json(user);
});

// return all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

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

  const formattedDate = exerciseDate.toISOString().split('T')[0];
  const result = {
    _id: user._id,
    username: user.username,
    description,
    duration: parseInt(duration, 10),
    date: formattedDate
  };

  res.status(201).json(result);
})

app.get('/api/users/:_id/logs?[from][&to][&limit]', (req, res) => {
  const user = users.find(u => u._id === req.params._id);
  if (!user) {
    return res.status(400).json({ error: 'Unknown userId' });
  }
  const { from, to, limit } = req.query;
  const logs = []; // store the user's exercise logs
  const result = {
    _id: user._id,
    username: user.username,
    count: logs.length,
    log: logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: log.date
    }))
  };
  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from date format' });
    }
    result.log = result.log.filter(log => new Date(log.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid to date format' });
    }
    result.log = result.log.filter(log => new Date(log.date) <= toDate);
  }
  if (limit) {
    const limitNumber = parseInt(limit, 10);
    if (isNaN(limitNumber) || limitNumber < 0) {
      return res.status(400).json({ error: 'Invalid limit' });
    }
    result.log = result.log.slice(0, limitNumber);
  } 
  res.json(result); 
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
