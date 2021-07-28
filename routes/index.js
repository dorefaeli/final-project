let express = require('express');
let router = express.Router();
let path = require('path');
const connection = require('../database');
let imagesUpdateTime;
let images = {};
let waitingCount = 0;

/* GET favicon */
router.get('/favicon.ico', function(req, res, next) {
  res.sendFile(path.resolve(__dirname,'../public/icons/favicon.ico'));
});


/* GET home page */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname,'../public/index.html'));
});

router.get('/status', function(req, res, next) {
  connection.query("SELECT * FROM finalProject.store_details ORDER BY id DESC LIMIT 1;", function (err, result) {
    if (err) throw err;
    result[0].outside = waitingCount;
    res.send(JSON.stringify(result[0]));
  });
});

router.post('/entryStatus', function(req, res, next) {
  images = req.body.images;
  waitingCount = req.body.waiting;
  imagesUpdateTime = Date.now();
  res.sendStatus(200);
});

router.get('/images', function(req, res, next) {
  res.send(JSON.stringify({imagesUpdateTime: imagesUpdateTime, images: images}));
});

router.get('/DBData', function(req, res, next) {
  connection.query("SELECT * FROM finalProject.customers ORDER BY entrance_time;", function (err, result) {
    if (err) throw err;
    res.send(JSON.stringify(result));
  });
});

module.exports = router;
