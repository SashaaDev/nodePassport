const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const pug = require('pug');
const app = express();
const port = 3000;

const secretKey = 'my_secret_key';

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.engine('ejs', ejs.__express);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const users = [
  { id: 1, name: 'User One', email: 'userone@example.com', password: 'password1' },
  { id: 2, name: 'User Two', email: 'usertwo@example.com', password: 'password2' }
];

const articles = [
  { id: 1, title: 'Article One', content: 'Content of article one.' },
  { id: 2, title: 'Article Two', content: 'Content of article two.' }
];

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send('Unauthorized');
  }
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).send('Forbidden');
    }
    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  res.render('pug/index');
});

app.get('/users', authenticateToken, (req, res) => {
  res.render('pug/users', { users });
});

app.get('/users/:userId', authenticateToken, (req, res) => {
  const user = users.find(u => u.id == req.params.userId);
  if (user) {
    res.render('pug/user', { user });
  } else {
    res.status(404).send('User not found');
  }
});

app.get('/articles', (req, res) => {
  ejs.renderFile(path.join(__dirname, 'views/ejs/articles.ejs'), { articles }, (err, html) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(html);
    }
  });
});

app.get('/articles/:articleId', (req, res) => {
  const article = articles.find(a => a.id == req.params.articleId);
  if (article) {
    ejs.renderFile(path.join(__dirname, 'views/ejs/article.ejs'), { article }, (err, html) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      } else {
        res.send(html);
      }
    });
  } else {
    res.status(404).send('Article not found');
  }
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const user = { id: users.length + 1, name, email, password };
  users.push(user);
  res.status(201).send('User registered');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, secretKey, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });
  res.send('Logged in');
});

app.post('/theme', (req, res) => {
  const { theme } = req.body;
  res.cookie('theme', theme, { maxAge: 900000, httpOnly: true });
  res.send('Theme saved');

});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
