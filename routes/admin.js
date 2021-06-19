const express = require('express');
const router = express.Router();
const path = require('path');
const connection = require('../database');

/* GET admin portal. */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname,'../public/admin_login.html'));
});

router.post('/', function(req, res, next) {
  let username = req.body.uname;
  let password = req.body.psw;
  let query = `SELECT * FROM finalProject.users WHERE user="${username}" AND password=sha1("${password}");`
  connection.query(query, function (err, result) {
    if (err) throw err;
    if (result.length >= 1) {
      res.sendFile(path.resolve(__dirname,'../public/admin.html'));
    } else {
      res.sendFile(path.resolve(__dirname,'../public/admin_failed_login.html'));
    }
  });
});

router.post('/updateStoreStatus', function(req, res, next) {
  let allowed = req.body.allowed;
  let inside = req.body.inside;
  let outside = req.body.outside;
  let query = `INSERT INTO store_details (allowed, inside, outside) VALUES (${allowed}, ${inside}, ${outside});`
  connection.query(query, function (err, result) {
    if (err) res.send(err)
    else res.sendStatus(200);
  });
});

module.exports = router;
