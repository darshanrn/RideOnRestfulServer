var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('carpool.db');
var dbSelectStmt = db.prepare('SELECT name, mobile FROM users');
var dbSelectAllRidesStmt = db.prepare('SELECT source, destination, time, type, username, id FROM traveldata');
var dbInsertStmt = db.prepare('INSERT INTO users (name, password, mobile) VALUES (?, ?, ?)');
var dbusernameSelectStmt = db.prepare('SELECT name, password FROM users WHERE name = ? AND password = ?');
var dbGetUserDetailsStmt = db.prepare('SELECT name, mobile, id FROM users WHERE name = ?');
var dbInsertTravelDetailsStmt = db.prepare('INSERT INTO traveldata (source, destination, time, frequency, type, username) VALUES (?, ?, ?, ?, ?, ?)');
var dbInsertAgreedMappingStmt = db.prepare('INSERT INTO agreedMapping (travelId, userId) VALUES (?, ?)');
var dbSelectRecentUserHistory = db.prepare('SELECT id, source, destination, type from traveldata where id in (SELECT DISTINCT travelId FROM agreedMapping where userId = ? order by id DESC limit 5)');

var mimeTypes = {'html': 'text/html', 'png': 'image/png',
    'js': 'text/javascript', 'css': 'text/css'};

function serveFromDisk(filename, response) {
    "use strict";
    var pathname;
    pathname = path.join(process.cwd(), filename);
    // SECURITY HOLE: Check for invalid characters in filename.
    // SECURITY HOLE: Check that this accesses file in CWD's hierarchy.
    path.exists(pathname, function (exists) {
        var extension, mimeType, fileStream;
        if (exists) {
            extension = path.extname(pathname).substr(1);
            mimeType = mimeTypes[extension] || 'application/octet-stream';
            response.writeHead(200, {'Content-Type': mimeType});
            console.log('serving ' + filename + ' as ' + mimeType);

            fileStream = fs.createReadStream(pathname);
            fileStream.pipe(response);
        } else {
            console.log('does not exist: ' + pathname);
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('404 Not Found\n');
            response.end();
        }
    }); //end path.exists
}

function fetchMessages(response) {
    "use strict";
    var jsonData;
    console.log('Fetching User Details...');
    response.writeHead(200, {'Content-Type': 'application/json'});
    jsonData = { users: [] };
    dbSelectStmt.each(function (err, row) {
        jsonData.users.push({ name: row.name, mobile: row.mobile });
    }, function () {
        response.write(JSON.stringify(jsonData));
        response.end();
    });
}

function allRides(response) {
    "use strict";
    var jsonData;
    console.log('Fetching all ride details...');
    response.setHeader("Access-Control-Allow-Origin", "*");
	response.writeHead(200, {'Content-Type': 'application/json'});
    jsonData = { rides: [] };
    dbSelectAllRidesStmt.each(function (err, row) {
        jsonData.rides.push({ source: row.source, destination: row.destination, time: row.time, type: row.type, username: row.username, id: row.id });
    }, function () {
        response.write(JSON.stringify(jsonData));
        response.end();
    });
}

function getUserDetails(request, response)
{
	var url_parts = url.parse(request.url, true);
	var result = url_parts.query;
	console.log("Getting user details..");
	dbGetUserDetailsStmt.get(result.username, function(err, row){
		if(row != undefined)
		{
			response.setHeader("Access-Control-Allow-Origin", "*");
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify({ name: row.name, mobile: row.mobile, id: row.id }));
			response.end();
		}
		else
			sendNotOk(response, "User does not exist");
	});
}

function getUserHistory(request, response)
{
	var url_parts = url.parse(request.url, true);
	var result = url_parts.query;
	console.log("Getting user history details..");

	var jsonData;
	    console.log('Fetching all ride details...');
	    response.setHeader("Access-Control-Allow-Origin", "*");
		response.writeHead(200, {'Content-Type': 'application/json'});
	    jsonData = { history: [] };
	    dbSelectRecentUserHistory.each(result.userId, function (err, row) {
	        jsonData.history.push({ source: row.source, destination: row.destination, type: row.type, id: row.id });
	    }, function () {
	        response.write(JSON.stringify(jsonData));
	        response.end();
    });
}

function authenticate(request, response) {
    "use strict";
    var url_parts = url.parse(request.url, true);
	var postText = url_parts.query;
	var username = postText.name;
	var password = postText.password;

	dbusernameSelectStmt.get(username, password, function(err, row){
		if(row != undefined)
		{
			console.log("Authenticated...");
			sendOk(response, "Authenticated");
		}
		else
			sendNotOk(response, "Not Authenticated");
	});
}

function tagUserToRoute(request, response) {
    "use strict";
    console.log('Tagging User to Route');
    request.setEncoding('utf8');

    var url_parts = url.parse(request.url, true);
	var postText = url_parts.query;

 	dbInsertAgreedMappingStmt.run(postText.travelId, postText.userId, function () {
		console.log("User tagged to route Successfully...");
		sendOk(response, "User tagged to route Successfully...");
	});

}


function addNewUser(request, response) {
    "use strict";
    console.log('Adding User');
    request.setEncoding('utf8');

    var url_parts = url.parse(request.url, true);
	var postText = url_parts.query;

 	dbInsertStmt.run(postText.name, postText.password, postText.mobile, function () {
		console.log("User Added Successfully...");
		sendOk(response, "User Added...");
	});

}

function addNewTravelData(request, response) {
    "use strict";
    console.log('Adding Travel Data');
    request.setEncoding('utf8');

    var url_parts = url.parse(request.url, true);
	var postText = url_parts.query;

 	var insert = dbInsertTravelDetailsStmt.run(postText.source, postText.destination, postText.time, postText.frequency, postText.type, postText.username, function () {
		console.log("User Travel Data Successfully... with Id " + insert.lastID);
		sendOkWithId(response,  insert.lastID, "User Travel Data...");
	});
}

function sendOkWithId(response, insertId, message){
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write("SUCCESS###" + insertId);
	response.end();
}

function sendOk(response, message){
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write("SUCCESS");
	response.end();
}

function sendNotOk(response, message){
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write("FAILURE");
	response.end();
}

function sendInvalid(response, message){
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write("Invalid request");
	response.end();
}

function processRequest(request, response) {
    "use strict";
    var uri;
    uri = url.parse(request.url).pathname;
    if (uri === '/fetch') {
        fetchMessages(response);
    } else if (uri === '/addnew') {
        addNewUser(request, response);
    } else if (uri === '/authenticate') {
        authenticate(request, response);
    } else if (uri === '/allRides') {
        allRides(response);
    } else if (uri === '/getUserDetails') {
        getUserDetails(request, response);
    } else if (uri === '/addNewTravelData') {
        addNewTravelData(request, response);
    } else if (uri === '/tagUserToRoute') {
        tagUserToRoute(request, response);
	} else if (uri === '/getUserHistory') {
        getUserHistory(request, response);
    } else {
        sendInvalid(response, "");
    }
}

http.createServer(processRequest).listen(8888);
console.log('started');