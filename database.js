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
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        let queue = 'entered';

        channel.assertQueue(queue, {
            durable: true
        });

        // reads messages from "enter" queue
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        channel.consume(queue, function (msg) {
            console.log(" [x] Received new person entered");

            // update db
            DBconnection.query("UPDATE store_details SET inside = inside + 1 WHERE id = 1", function (err, result) {
                if (err) throw err;
            });

            // add a message to update queue
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                let queue = 'update';
                let msg = '';

                channel.assertQueue(queue, {
                    durable: false
                });

                channel.sendToQueue(queue, Buffer.from(msg));
                console.log(' [x] Sent "updated"', msg);
            });
            channel.ack(msg)
        }, {
            noAck: false
        });
    });
    // listening for new exits
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        let queue = 'exited';

        channel.assertQueue(queue, {
            durable: true
        });

        // reads messages from "enter" queue
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        channel.consume(queue, function (msg) {
            console.log(" [x] Received exit");

            // update db
            DBconnection.query("UPDATE store_details SET inside = inside - 1 WHERE id = 1", function (err, result) {
                if (err) throw err;
            });

            // add a message to update queue
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                let queue = 'update';
                let msg = '';

                channel.assertQueue(queue, {
                    durable: false
                });

                channel.sendToQueue(queue, Buffer.from(msg));
                console.log(' [x] Sent "updated"', msg);
            });
            channel.ack(msg)
        }, {
            noAck: false
        });
    });
});


module.exports = DBconnection