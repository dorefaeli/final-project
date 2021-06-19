const mysql = require('mysql');
const amqp = require('amqplib/callback_api');

let DBconnection = mysql.createConnection({
    host     : 'localhost',
    port     : '3307',
    user     : 'root',
    password : 'my-secret-pw',
    database : 'finalProject'
});

DBconnection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});


amqp.connect('amqp://localhost', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    // listening for new entrances
    connection.createChannel(function (channelCreationError, channel) {
        if (channelCreationError) {
            throw channelCreationError;
        }
        let queue = 'entered';

        channel.assertQueue(queue, {
            durable: true
        });
        // reads messages from "enter" queue
        channel.consume(queue, function (msg) {
            let msg_content = msg.content.toString().split("-")
            console.log(" [x] Received new person entered");
            console.log("gender is: %s and age is: %s", msg_content[0], msg_content[1]);
            // update db
            let query = "INSERT INTO finalProject.store_details (allowed, inside, outside) SELECT allowed, inside+1, outside FROM finalProject.store_details ORDER BY id DESC LIMIT 1;"
            DBconnection.query(query, function (err, result) {
                if (err) throw err;
            });
            query = `INSERT INTO finalProject.customers (gender, age) VALUES ("${msg_content[0]}", ${msg_content[1]});`
            DBconnection.query(query, function (err, result) {
                if (err) throw err;
            });
            channel.ack(msg)
        }, {
            noAck: false
        });
    });
    // listening for new exits
    connection.createChannel(function (channelCreationError, channel) {
        if (channelCreationError) {
            throw channelCreationError;
        }
        let queue = 'exited';

        channel.assertQueue(queue, {
            durable: true
        });

        // reads messages from "exited" queue
        channel.consume(queue, function (msg) {
            console.log(" [x] Received person exit");

            // update db
            let query = "INSERT INTO finalProject.store_details (allowed, inside, outside) SELECT allowed, inside-1, outside FROM finalProject.store_details ORDER BY id DESC LIMIT 1;"
            DBconnection.query(query, function (err, result) {
                if (err) throw err;
            });
            channel.ack(msg)
        }, {
            noAck: false
        });
    });
});


module.exports = DBconnection