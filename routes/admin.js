const express = require('express');
const router = express.Router();
const path = require('path');
const connection = require('../database')

/* GET admin portal. */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname,'../public/admin_login.html'));
});

router.post('/', function(req, res, next) {
  let username = req.body.uname;
  let password = req.body.psw;
  let userQuery = 'SELECT * FROM finalProject.users WHERE user="' + username + '" AND password=sha1("' + password + '");'
  connection.query(userQuery, function (err, result) {
    if (err) throw err;
    if (result.length >= 1) {
      res.sendFile(path.resolve(__dirname,'../public/admin.html'));
    } else {
      res.sendFile(path.resolve(__dirname,'../public/admin_failed_login.html'));
    }
  });
});

module.exports = router;
