const mysql = require('mysql');
const amqp = require('amqplib/callback_api');

let DB_connection = mysql.createConnection({
    host: 'localhost',
    port: '3307',
    user: 'root',
    password: 'my-secret-pw',
    database: 'finalProject'
});

DB_connection.connect(function (err) {
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
            let query = "INSERT INTO finalProject.store_details (allowed, inside, age_threshold, masks_needed) SELECT allowed, inside+1, age_threshold, masks_needed FROM finalProject.store_details ORDER BY id DESC LIMIT 1;"
            DB_connection.query(query, function (err) {
                if (err) throw err;
            });
            query = `INSERT INTO finalProject.customers (gender, age)
                     VALUES ("${msg_content[0]}", ${msg_content[1]});`
            DB_connection.query(query, function (err) {
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
            let query = "INSERT INTO finalProject.store_details (allowed, inside, age_threshold, masks_needed) SELECT allowed, greatest(inside-1, 0), age_threshold, masks_needed FROM finalProject.store_details ORDER BY id DESC LIMIT 1;"
            DB_connection.query(query, function (err) {
                if (err) throw err;
            });
            channel.ack(msg)
        }, {
            noAck: false
        });
    });
});


module.exports = DB_connection