'use strict';
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();

require('dotenv').config();

// 開発時にDBなしで表示確認するためのモックモード
const useMock = process.env.USE_MOCK_DATA === 'true' && process.env.NODE_ENV !== 'production';
const mockArticles = [
  {
    id: 1,
    title: 'サンプル記事（全体公開）',
    summary: 'これはモックのサマリーです。全体公開で誰でも見られます。',
    content: 'モックデータの本文です。DBが無くても表示確認できます。',
    category: 'all'
  },
  {
    id: 2,
    title: 'サンプル記事（会員限定）',
    summary: 'モックによる会員限定記事のプレビュー。',
    content: '会員限定の本文です。ログイン状態でのみ表示されます。',
    category: 'limited'
  }
];

// 静的ファイルとテンプレートエンジン設定
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({extended: false}));

// DB接続は必要なルートで都度作成（遅延）し、DB未起動でもサーバが落ちないようにする
function createDbConnection() {
  const conn = process.env.NODE_ENV === 'production'
    ? mysql.createConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
      })
    : mysql.createConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: 'localhost'
      });
  conn.on('error', (err) => {
    console.error('[mysql] connection error:', err);
  });
  return conn;
}
// mysql2は初回クエリ時に接続を確立するため、起動時connectは行わない

// セッション設定（SESSION_SECRET を使用）
const isProduction = process.env.NODE_ENV === 'production';
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProduction) {
    console.error('SESSION_SECRET が未設定です。環境変数で設定してください。');
    process.exit(1);
  } else {
    console.warn('SESSION_SECRET が未設定です。開発用の暫定値を使用します。');
    sessionSecret = 'dev_insecure_secret_change_me';
  }
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction, // HTTPS 環境のみセキュアクッキー
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7日
    }
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
  const renderList = (items) => res.render('list.ejs', { articles: Array.isArray(items) ? items : [] });
  if (useMock) {
    return renderList(mockArticles);
  }
  const connection = createDbConnection();
  connection.query('SELECT * FROM articles', (error, results) => {
    if (error) {
      console.error('[mysql] /list query error:', error);
      res.status(503);
      return renderList([]);
    }
    return renderList(results);
  });
  // コネクションはmysql2が初回クエリ時に開くため、簡便のためcloseは省略（プロセス終了で解放）
});

app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  if (useMock) {
    const article = mockArticles.find(a => String(a.id) === String(id));
    return res.render('article.ejs', { article: article || {} });
  }
  const connection = createDbConnection();
  connection.query('SELECT * FROM articles WHERE id = ?', [id], (error, results) => {
    if (error) {
      console.error('[mysql] /article query error:', error);
      return res.status(503).render('article.ejs', { article: {} });
    }
    res.render('article.ejs', { article: results[0] });
  });
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
    if (useMock) {
      return next();
    }
    const connection = createDbConnection();
    connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (error, results) => {
        if (error) {
          console.error('[mysql] duplicate username check error:', error);
          errors.push('現在、登録処理を行えません（DBエラー）');
          return res.render('signup.ejs', { errors });
        }
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
    if (useMock) {
      return next();
    }
    const connection = createDbConnection();
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error('[mysql] duplicate email check error:', error);
          errors.push('現在、登録処理を行えません（DBエラー）');
          return res.render('signup.ejs', { errors });
        }
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
      if (useMock) {
        req.session.userId = 9999;
        req.session.username = username;
        return res.redirect('/list');
      }
      const connection = createDbConnection();
      connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hash],
        (error, results) => {
          if (error) {
            console.error('[mysql] signup insert error:', error);
            return res.status(503).render('signup.ejs', { errors: ['現在、登録処理を行えません（DBエラー）'] });
          }
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
    if (useMock) {
      req.session.userId = 1;
      req.session.username = 'mockuser';
      return res.redirect('/list');
    }
    const connection = createDbConnection();
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (error) {
          console.error('[mysql] login select error:', error);
          return res.status(503).render('login.ejs', { errors: ['現在、ログイン処理を行えません（DBエラー）'] });
        }
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

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`[server] listening on port ${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});