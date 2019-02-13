var app = require("express")();
var mysql = require("mysql");
var http = require('http').Server(app);
var io = require("socket.io")(http);
const connections = [];

/* Creating POOL MySQL connection.*/

var pool = mysql.createPool({
  port:             '8889',
  connectionLimit:  100,
  host:             'localhost',
  user:             'root2',
  password:         'password',
  database:         'socket',
  debug:            false
});

pool.on('connection', function (connection) {
  console.log('DB Connection established');
  connection.on('error', function (err) {
    console.error(new Date(), 'MySQL error', err.code);
  });
  connection.on('close', function (err) {
    console.error(new Date(), 'MySQL close', err);
  });
})

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/index.html');

});

/*  This is auto initiated event when Client connects to Your Machien.  */

io.sockets.on('connection', function (socket) {

  connections.push(socket);
  console.log(' %s sockets are connected', connections.length);

  socket.on('status added', function (status) {
    add_status(status, function (res) {
      if (res) {
        io.emit('refresh feed', status);
      } else {
        io.emit('error');
      }
    });
  });

  socket.on('get messages', function () {
  pool.query('SELECT `s_text` FROM status', function(err, rows, fields) {
    if (err) throw err;
    console.log('The solution is: ', rows[0].s_text);
    rows.forEach(element => {
      io.emit('refresh feed', element.s_text);
    });
  });
  });

  socket.on('disconnect', function (socket) {
    connections.splice(connections.indexOf(socket), 1);
    console.log(' %s sockets are connected', connections.length);
  });

});



var add_status = function (status, callback) {
  pool.getConnection(function (err, connection) {
    if (err) {
      callback(true);
      return;
    }
    console.log('status added: ', status)
    connection.query("INSERT INTO `status` (`s_text`) VALUES ('" + status + "')", function (err, rows) {
      connection.release();
      if (!err) {
        callback(true);
      }
    });
    connection.on('error', function (err) {
      callback(true);
      return;
    });
  });
}


http.listen(3000, function () {
  console.log("Listening on 3000");
});
