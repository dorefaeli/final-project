var express = require('express');
var router = express.Router();

/* GET admin portal. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
