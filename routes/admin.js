let express = require('express');
let router = express.Router();
let path = require('path');

/* GET admin portal. */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname,'../public/admin_login.html'));
});

router.post('/', function(req, res, next) {
  let username = req.body.uname;
  let password = req.body.psw;
  res.sendFile(path.resolve(__dirname,'../public/admin.html'));
});

module.exports = router;
