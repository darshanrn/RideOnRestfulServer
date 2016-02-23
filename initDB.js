var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('carpool.db');

var data = [
    ["darshanrn", "Abcd1234", "9886076768"],
    ["Elmerfudd", "huntinghabbits", "1234567890"],
    ["BugsBunny", "hungrybunny", "0987654321"],
    ["ElmerFudd", "unknown", "9887654876"]
];

var travelData = [
	["Jayanagar", "Madiwala", "10:00:00", "Today", "Offer", "Darshan R N"],
	["Hebbal", "KBS Stop", "01:00:00", "Daily", "Offer", "George Fernandes"],
	["Thyagaraja Nagar", "Manyata Tech Park", "10:30:00", "Tomorrow", "Request", "Himesh R"],

];

var agreedMapping = [
	["1", "1"],
	["1", "2"],
	["2", "3"]
];

db.run("CREATE TABLE users ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT, mobile TEXT )", function () {
    "use strict";
    var insStmt, i;

    insStmt = db.prepare('INSERT INTO users (name, password, mobile) VALUES (?, ?, ?)');
    for (i = 0; i < data.length; i += 1) {
        insStmt.run(data[i]);
    }
    insStmt.finalize();
});

db.run("CREATE TABLE traveldata ( id INTEGER PRIMARY KEY AUTOINCREMENT , source TEXT, destination TEXT, time TIME, frequency TEXT, type TEXT , username TEXT )", function () {
    "use strict";
    var insStmt, i;

    insStmt = db.prepare('INSERT INTO traveldata (source, destination, time, frequency, type, username) VALUES (?, ?, ?, ?, ?, ?)');
    for (i = 0; i < travelData.length; i += 1) {
        insStmt.run(travelData[i]);
    }
    insStmt.finalize();
});

db.run("CREATE TABLE agreedMapping ( id INTEGER PRIMARY KEY AUTOINCREMENT , travelId INTEGER, userId INTEGER)", function () {
    "use strict";
    var insStmt, i;

    insStmt = db.prepare('INSERT INTO agreedMapping (travelId, userId) VALUES (?, ?)');
    for (i = 0; i < data.length; i += 1) {
        insStmt.run(agreedMapping[i]);
    }
    insStmt.finalize();
});
