let express = require('express');
let router = express.Router();
let path = require('path');
const connection = require('../database')


//todo remove!
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


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

module.exports = router;
