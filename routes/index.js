let express = require('express');
let router = express.Router();
let path = require('path');
const connection = require('../database');
let imagesUpdateTime;
let images = {};


/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname,'../public/index.html'));
});

router.get('/status', function(req, res, next) {
  connection.query("SELECT * FROM finalProject.store_details;", function (err, result) {
    if (err) throw err;
    res.send(JSON.stringify(result[0]));
  });
});

router.post('/images', function(req, res, next) {
  images = req.body.images;
  imagesUpdateTime = Date.now();
  res.sendStatus(200);
});

router.get('/images', function(req, res, next) {
  res.send(JSON.stringify({imagesUpdateTime: imagesUpdateTime, images: images}));
});

module.exports = router;
