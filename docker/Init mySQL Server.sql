CREATE SCHEMA finalProject;
USE finalProject;
CREATE TABLE users (user text, password varchar(40));
INSERT INTO users (user, password) VALUES ("dorefaeli", sha1("7895123"));
CREATE TABLE store_details (id int NOT NULL AUTO_INCREMENT, update_time timestamp, allowed int, inside int, age_threshold int, masks_needed enum('y', 'n'), PRIMARY KEY (id));
CREATE TABLE customers (id int NOT NULL AUTO_INCREMENT, entrance_time timestamp, gender enum('m', 'f'), age int, PRIMARY KEY (id));
INSERT INTO store_details (allowed, inside, age_threshold, masks_needed) VALUES (0, 0, 15, 'y');