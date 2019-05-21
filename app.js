var express = require('express');
var app = express();
var DButilsAzure = require('./DButils');

DButilsAzure.execQuery("INSERT INTO names (name) VALUES ('adi')")

var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

//Example
app.get('/select', function(req, res){
    DButilsAzure.execQuery("SELECT * FROM names")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

app.get('/getPoint', function(req, res){
    var pointName = req.pointName;
    DButilsAzure.execQuery("SELECT top (2) p.[description], p.[rank], p.[numofviews] , r.[review] FROM [points] p inner join [reviews] r on p.[id]=r.[pointid] where p.[name] = " + pointName + " order by r.[date] ASC ")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})
