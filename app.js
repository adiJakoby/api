var express = require('express');
var app = express();
var DButilsAzure = require('./DButils');


var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

app.use(require('body-parser').json())

//Example
// app.get('/select', function(req, res){
//     DButilsAzure.execQuery("SELECT * FROM names")
//     .then(function(result){
//         res.send(result)
//     })
//     .catch(function(err){
//         console.log(err)
//         res.send(err)
//     })
// })


app.get('/getPoint', function(req, res){
    let pointName = req.query.pointName;
    // console.log("**************" + pointName);
    DButilsAzure.execQuery("SELECT top (2) p.[description], p.[rank], p.[numofviews] , r.[review] FROM [points] p inner join [reviews] r on p.[id]=r.[pointid] where p.[name] = '" + pointName + "' order by r.[date] ASC ")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})


//login
app.post('/logIn', function(req, res){
    let userName = req.body.userName;
    let password = req.body.password;
    // console.log("**************" + userName + "   " + password);
    DButilsAzure.execQuery(
        "IF ( SELECT COUNT (*) FROM [dbo].[Passwords] P WHERE P.[USERNAME] = '" + userName + "' AND P.[PASSWORD] = HASHBYTES('SHA2_512','" + password + "')) > 0 SELECT 1 ELSE SELECT 0 ")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//restore password
app.post('/restorePassword', function(req, res){
    let userName = req.body.userName;
    let question = req.body.question;
    let answer = req.body.answer;
    DButilsAzure.execQuery(
        "IF ( SELECT COUNT (*) FROM [dbo].[Questions] Q WHERE Q.[USERNAME] = '" + userName + "' AND Q.[QUESTION] = '" + question + "' AND Q.[ANSWER] = '" + answer + "') = 1 SELECT * FROM [dbo].[Passwords] P WHERE P.[USERNAME] = username")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

