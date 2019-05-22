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

//add favorite point for a user
app.put('/addSavePoint', function(req, res){
    let userName = req.body.userName;
    let pointName = req.body.pointName;
    let index = req.body.i;
    DButilsAzure.execQuery(
        "DECLARE @ID AS INT SET @ID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') INSERT INTO FavoritesPoint(USERNAME, [POINTID], [INDEX], DATE) VALUES('" + userName +"', @ID," + index + ", GETDATE())")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//get last two saved points of user.
app.get('/getLastTwoSavedPoints', function(req, res){
    let userName = req.query.userName;
    DButilsAzure.execQuery(
        "SELECT top (2) p.[pointName] FROM [points] p inner join [favoritesPoint] f on f.[pointid]=p.[pointid] where f.[userName] = '" + userName + "' order by f.[date] ASC ")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//get last two saved points of user.
app.delete('/deleteSavedPoint', function(req, res){
    let userName = req.query.userName;
    let pointName = req.query.pointName;
    DButilsAzure.execQuery(
        "DECLARE @ID AS INT SET @ID = (SELECT POINTID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') DELETE FROM [FavoritesPoint] F WHERE F[POINTID] = @ID AND F[USERNAME] = '" + userName + "'")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//get the number of saved points of a user.
app.get('/getNumSavedPoints', function(req, res){
    let userName = req.query.userName;
    DButilsAzure.execQuery(
        "SELECT COUNT(*) FROM FAVORITESPOINT WHERE USERNAME = '" + userName + "'")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//get all saved points of a user.
app.get('/getSavedPoints', function(req, res){
    let userName = req.query.userName;
    DButilsAzure.execQuery(
        "SELECT * FROM FAVORITESPOINT WHERE USERNAME = '" + userName + "'")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//add new review to point.
app.put('/addReview', function(req, res){
    let userName = req.query.userName;
    let pointName = req.query.pointName;
    let review = req.query.review;
    DButilsAzure.execQuery(
        "DECLARE @RID AS INT SET @RID = (SELECT TOP (1) ID FROM [REVIEWS] R order by R.[ID] ASC) + 1 DECLARE @PID AS INT SET @PID = (SELECT POINTID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') INSERT INTO REVIEWS(ID, USERNAME, POINTID, REVIEW, DATE) VALUES(@RID, '" + userName + "', @PID, '" + review + "')")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//get all points.
app.get('/getAllPoints', function(req, res){
    let review = req.query.review;
    DButilsAzure.execQuery(
        "SELECT * FROM POINTS")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//register
app.post('/register', function (req, res) {
    let userName = req.body.userName;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let password = req.body.password;
    let city = req.body.city;
    let country = req.body.country;
    let email = req.body.email;
    let domain1 = req.body.domain1;
    let domain2 = req.body.domain2;
    let question = req.body.question;
    let answer = req.body.answer;
    if(checkPassword(password)&&checkUserName(userName)){
        //USER CREATION 
        DButilsAzure.execQuery("INSERT INTO USERS U VALUES ('" + userName + "','" + firstName + "', " + lastName + "', " + city + "' , '" + country + "' , '" + email +"') INSERT INTO Passwords VALUES ('" + userName + "' , '" + password + "') INSERT INTO FavoritesCategories VALUES ('" + userName + "' , '" + domain1 + "') INSERT INTO FavoritesCategories VALUES ('" + userName + "' , '" + domain2 + "') INSERT INTO Questions VALUES('" + userName + "' , '" + question + "', '" + answer + "' )")
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
    }
})

//check valide user name
function checkUserName(userName) {
    if (!(/^[a-zA-Z]+$/.test(userName))) {
        // alert - user name have to include only letters
        return false;
    }
    if (userName.length > 8 || userName.length < 3) {
        //alert user name have to includes between 3-8 chars
        return false;
    }
    return true;
}
//check valid password
function checkPassword(password) {
    if (!(password.matches("^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]+$"))) {
        //alers pass must contain only letters and numbers
        return false;
    }
    if (password.length > 8 || password.length < 3) {
        //alert password have to includes between 3-8 chars
        return false;
    }
    return true;
}

function checkCountry(country){
    let xml = fs.readFile("countries.xml",function(err, data){

    } )
} 
