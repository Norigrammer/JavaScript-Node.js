const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

require('dotenv').config();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = process.env.NODE_ENV === 'production'
  ? mysql.createConnection({
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
  }) : mysql.createConnection({
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    host: 'localhost'
});

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = 'ゲスト';
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM articles',
    (error, results) => {
      res.render('list.ejs', { articles: results });
    }
  );
});

app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM articles WHERE id = ?',
    [id],
    (error, results) => {
      res.render('article.ejs', { article: results[0] });
    }
  );
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs', { errors: [] });
});

app.post('/signup', 
  (req, res, next) => {
    console.log('入力値の空チェック - /signup');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];
    if (username === '') {
      errors.push('ユーザー名が空です');
    }
    if (email === '') {
      errors.push('メールアドレスが空です');
    }
    if (password === '') {
      errors.push('パスワードが空です');
    }
    console.log(errors);
    if (errors.length > 0) {
      res.render('signup.ejs', { errors: errors });
    } else {
      next();
    }
  },

  (req, res, next) => {
    console.log('ユーザー名の重複チェック');
    const username = req.body.username;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (error, results) => {
        if (results.length > 0) {
          errors.push('すでに登録されているユーザー名です');
          res.render('signup.ejs', { errors: errors });
        } else {
          next();
        }
      }
    );
  },

  (req, res, next) => {
    console.log('メールアドレスの重複チェック');
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          errors.push('すでに登録されているメールアドレスです');
          res.render('signup.ejs', { errors: errors });
        } else {
          next();
        }
      }
    );
  },

  (req, res) => {
    console.log('新規登録');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hash],
        (error, results) => {
          req.session.userId = results.insertId;
          req.session.username = username;
          res.redirect('/list');
        }
      );
    });
  }
);

app.get('/login', (req, res) => {
  res.render('login.ejs', { errors: [] });
});

app.post('/login', 
  (req, res, next) => {
    console.log('入力値の空チェック - /login');
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];
    if (email === '') {
      errors.push('メールアドレスが空です');
    }
    if (password === '') {
      errors.push('パスワードが空です');
    }
    console.log(errors);
    if (errors.length > 0) {
      res.render('login.ejs', { errors: errors });
    } else {
      next();
    }
  },

  (req, res) => {
    console.log('ログイン');
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password
          const hash = results[0].password
          const errors = [];
          bcrypt.compare(plain, hash, (error, isEqual) => {
            if (isEqual) {
              req.session.userId = results[0].id;
              req.session.username = results[0].username;
              res.redirect('/list');
            } else {
              errors.push('パスワードが違います');
              res.render('login.ejs', { errors: errors });
            }
          });
        } else {
          errors.push('メールアドレスが違います');
          res.render('login.ejs', { errors: errors });
        }
      }
    );
  }
);

app.get('/logout',(req, res) => {
  req.session.destroy((error) => {
    res.redirect('/list');
  });
});

app.listen( process.env.PORT ?? 3000 );