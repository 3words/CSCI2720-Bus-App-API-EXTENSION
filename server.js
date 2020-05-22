/*
Group Memeber:
Yu Chun Fung Ray 1155094125
Pun Man Wing 1155092833
Ho Shing Fung 1155105818
Yip Kai Hin  1155105796
*/

const express = require('express');
const app = express();

var mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb://localhost/csci2720');
var Schema = mongoose.Schema;

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));

var xmlparser = require('express-xml-bodyparser');
app.use(xmlparser())

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function () {
  console.log("Connection is open...");
});

var UserSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    min: 4,
    max: 20
  },
  password: {
    type: String,
    required: true,
    min: 64,
    max: 64
  },
  homeLocation: {
    long: Number, default: 0,
    lat:  Number, default: 0
  }
});

var LocationSchema = mongoose.Schema({
  locationID: {
    type: Number,
    unique: true
  },
  name: {
    type: String
  },
  longitude: {
    type: Number
  },
  latitude: {
    type: Number
  }
});

var RouteSchema = mongoose.Schema({
  route: {
    type: String,
    unique: true
  },
  dest: {
    type: String
  },
  orig: {
    type: String
  }
});

var StopSchema = mongoose.Schema({
  loc: {
    type: Schema.Types.ObjectId,
    ref: 'Location',
    unique: false
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    unique: false
  },
  dir: {
    type: String
  },
  seq: {
    type: Number
  }
});

StopSchema.index({loc: 1, route: 1, dir:1}, {unique: true});

var CommentSchema = mongoose.Schema({
  loc: {
    type: Schema.Types.ObjectId,
    ref: 'Location'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  comment: {
    type: String
  },
  timeStamp: {
    type: Date
  }
});

var FavouriteSchema = mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  loc: {
    type: Schema.Types.ObjectId,
    ref: 'Location'
  }
});

var User = mongoose.model('User', UserSchema);
var Location = mongoose.model('Location', LocationSchema);
var Route = mongoose.model('Route', RouteSchema);
var Stop = mongoose.model('Stop', StopSchema);
var Comment = mongoose.model('Comment', CommentSchema);
var Favourite = mongoose.model('Favourite', FavouriteSchema);

//List all locations
app.get('/api/locations', function(req, res) {
  if(req.header('Authorization') != "Bearer csci2720")
    res.sendStatus(401);
  else {
    Location.find()
    .select('-__v -_id')
    .sort('locationID')
    .exec(function(err, results) {
      if(err) {
        res.send(err.codeName);
      } else {
        var response = "<locations>\n";
        for(result in results) {
          var temp = "<location>\n"
                    +"<name>"+ results[result].name +"</name>\n"
                    +"<id>"+ results[result].locationID +"</id>\n"
                    +"<latitude>"+ results[result].latitude +"</latitude>\n"
                    + "<longitude>"+ results[result].longitude +"</longitude>\n"
                    +"</location>\n";
          response += temp;
        }
        response += "</locations>\n";
        res.send(response);
      }
    });
  }
});

//Add a new location
app.post('/api/locations', function(req, res) {
  if(req.header('Authorization') != "Bearer csci2720")
    res.sendStatus(401);
  else {
    var inputName = req.body.location.name[0];
    var inputId = req.body.location.id[0];
    var inputLatitude = req.body.location.latitude[0];
    var inputLongitude = req.body.location.longitude[0];

    Location.findOne({locationID: inputId},
      function(err,result) {
        if(err) {
          res.send(err);
        } else if(result != null) {
          res.send("id already used!");
        } else {
          var newLocation = new Location({
            locationID: inputId,
            name: inputName,
            longitude: inputLongitude,
            latitude: inputLatitude
          });
          newLocation.save(function(err) {
            if(err) {
              res.send(err.codeName);
            } else {
              res.set('Location', 'http://csci2720.cse.cuhk.edu.hk/2023/api/locations/' + inputId.toString());
              res.send("Location Created!!<br>\n<br>\n"
                        +"Location ID: " + newLocation.locationID + "<br>\n"
                        +"Location Name: " + newLocation.name + "<br>\n"
                        +"Location Latitude: " + newLocation.latitude + "<br>\n"
                        +"Location Longitude: " + newLocation.longitude + "<br>\n");
            }
          });
        }
      });
  }
});

//Retrieve a location
app.get('/api/locations/:locId', function(req, res) {
  if(req.header('Authorization') != "Bearer csci2720")
    res.sendStatus(401);
  else {
    Location.findOne(
      {locationID: req.params["locId"]},
      function(err, result) {
        if(err) {
          res.send(err.codeName);
        } else if(result != null) {
          var response = "<location>\n"
                          +"<name>"+ result.name +"</name>\n"
                          +"<id>"+ result.locationID +"</id>\n"
                          +"<latitude>"+ result.latitude +"</latitude>\n"
                          + "<longitude>"+ result.longitude +"</longitude>\n"
                          +"</location>\n";
          res.send(response);
        } else {
          res.send("Invalid locId!");
        }
      })
  }
});

//Update a location
app.put('/api/locations/:locId', function(req, res) {
  if(req.header('Authorization') != "Bearer csci2720")
    res.sendStatus(401);
  else {
    var inputName = req.body.location.name[0];
    var inputId = req.body.location.id[0];
    var inputLatitude = req.body.location.latitude[0];
    var inputLongitude = req.body.location.longitude[0];


    Location.findOneAndUpdate(
      {locationID: req.params["locId"]},
      {
        locationID: inputId,
        name: inputName,
        longitude: inputLongitude,
        latitude: inputLatitude
      },
      function(err, result) {
        if(err) {
          res.send(err.codeName);
        } else if(result != null) {
          res.send("Success!");
        } else {
          res.send("id does not exists!")
        }
      });
  }
});

//Delete a location
app.delete('/api/locations/:locId', function(req, res) {
  if(req.header('Authorization') != "Bearer csci2720")
    res.sendStatus(401);
  else {
    var deleteId = req.params["locId"];

    Location.findOne(
      {locationID: deleteId},
      function(err, result) {
        if(err) {
          res.send(err.codeName);
        } else if (result != null) {
          result.remove();
          res.send("Location " + deleteId +" deleted successfully!");
        } else {
          res.send("id does not exists!")
        }
      });
  }
});

app.listen(2023);
