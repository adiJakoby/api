var express = require('express');
var app = express();
var DButilsAzure = require('./DButils');
var jwt=require('jsonwebtoken');


var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

app.use(require('body-parser').json())

secret = "ourSecret<3";

app.post("/private", (req, res) => {
    const token = req.header("x-auth-token");
    // no token
    if (!token) res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        next();
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
});

app.get('/getPoint', function(req, res){
    let pointName = req.body.pointName;
    DButilsAzure.execQuery("SELECT top (2) p.[description], p.[rank], p.[numofviews] , CASE WHEN r.[review] IS NOT NULL THEN r.[review] ELSE 'NO REVIEW TO SHOW'  END AS [REVIEW] FROM [points] p inner join [reviews] r on p.[id]=r.[pointid] where p.[name] = '" + pointName + "' order by r.[date] ASC ")
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

    DButilsAzure.execQuery(
        "IF ( SELECT COUNT (*) FROM [dbo].[Passwords] P WHERE P.[USERNAME] = '" + userName + "' AND P.[PASSWORD] = '" + password + "')) > 0 SELECT 1 ELSE SELECT 0 ")
    .then(function(result){      
        payload = { name: userName };
        options = { expiresIn: "1d" };
        const token = jwt.sign(payload, secret, options); 
        res.send(token)
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
    let userName = req.body.userName;
    DButilsAzure.execQuery(
        "SELECT top (2) p.[name] FROM [points] p inner join [favoritesPoint] f on f.[pointid]=p.[id] where f.[userName] = '" + userName + "' order by f.[date] DESC ")
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
    let userName = req.body.userName;
    let pointName = req.body.pointName;
    DButilsAzure.execQuery(
        "DECLARE @ID AS INT SET @ID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') DELETE FROM [FavoritesPoint]  WHERE [POINTID] = @ID AND [USERNAME] = '" + userName + "'")
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
    let userName = req.body.userName;
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
    let userName = req.body.userName;
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
    let userName = req.body.userName;
    let pointName = req.body.pointName;
    let review = req.body.review;
    DButilsAzure.execQuery(
        "DECLARE @RID1 AS INT SET @RID1 =  0 SET @RID1 = (SELECT COUNT(*) FROM [REVIEWS] R ) DECLARE @RID AS INT SET @RID = 0 IF (@RID1 > 0) BEGIN SET @RID = ((SELECT TOP (1) [ID] FROM [REVIEWS] R ORDER BY R.[ID] ASC) + 1) END DECLARE @PID AS INT SET @PID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') INSERT INTO REVIEWS(ID, USERNAME, POINTID, REVIEW, [DATE]) VALUES(@RID, '" + userName + "', @PID, '" + review + "', GETDATE())")
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

//get all points by category.
app.get('/getPointsByCatagory', function(req, res){
    let category = req.body.category;
    DButilsAzure.execQuery(
        "SELECT * FROM POINTS WHERE CATEGORIES = '" + category + "'")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})

//get all points by category.
app.put('/addRank', function(req, res){
    let pointName = req.body.pointName;
    let rank = req.body.rank;
    if(rank < 0 || rank > 5){
        res.send("The rank must be between 1 to 5")
    }
    else{
        DButilsAzure.execQuery(
            "DECLARE @ID AS INT SET @ID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') DECLARE @NUM AS INT SET @NUM = (SELECT NUMOFRANKS FROM [RANKS] R WHERE R.[POINTID] = @ID) DECLARE @LASTRANK AS FLOAT SET @LASTRANK = (SELECT [RANK] FROM [POINTS] P WHERE P.[ID] = @ID) DECLARE @NEWRANK AS FLOAT SET @NEWRANK = ((@LASTRANK*@NUM) + " + rank + ")/(@num + 1) UPDATE T SET T.[RANK] = @NEWRANK FROM POINTS T WHERE T.[ID] = @ID UPDATE F SET F.[NUMOFRANKS] = (@NUM+1) FROM RANKS F WHERE F.[POINTID] = @ID")
        .then(function(result){
            res.send(result)
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })
    }
})

//get all points by category.
app.get('/getRandomPoints', function(req, res){
    let minimalRank = req.body.minimalRank;
    if(rank < 0 || rank > 5){
        res.send("The minimal rank must be between 1 to 5")
    }
    else{
        DButilsAzure.execQuery(
            "SELECT * FROM POINTS P WHERE P.[RANK] >= " + rank + "")
        .then(function(result){
            res.send(result)
        })
        .catch(function(err){
            console.log(err)
            res.send(err)
        })
    }
})

app.get('/getTwoPopularPoints', function(req, res){
    let userName = req.body.userName;
    DButilsAzure.execQuery("DECLARE @CATEGORY1 AS NVARCHAR (100) DECLARE @CATEGORY2 AS NVARCHAR (100) SET @CATEGORY1 = (SELECT TOP (1) F.[CATEGORY] FROM [FavoritesCategories] F WHERE F.[USERNAME]='" + userName + "' ORDER BY F.[CATEGORY] DESC ) SET @CATEGORY2 = (SELECT TOP (1) F.[CATEGORY] FROM [FavoritesCategories] F WHERE F.[USERNAME]='DORINZ' ORDER BY F.[CATEGORY] ASC ) SELECT TOP (1) [NAME] FROM [POINTS] P1 WHERE P1.[CATEGORY] = @CATEGORY1 SELECT TOP (1) [NAME] FROM [POINTS] P2 WHERE P2.[CATEGORY] = @CATEGORY2")
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
        DButilsAzure.execQuery("INSERT INTO USERS VALUES ('" + userName + "','" + firstName + "', '" + lastName + "', '" + city + "' , '" + country + "' , '" + email +"') INSERT INTO Passwords VALUES ('" + userName + "' , HASHBYTES('SHA2_512' , '" + password + "' )) INSERT INTO FavoritesCategories VALUES ('" + userName + "' , '" + domain1 + "') INSERT INTO FavoritesCategories VALUES ('" + userName + "' , '" + domain2 + "') INSERT INTO Questions VALUES('" + userName + "' , '" + question + "', '" + answer + "' )")
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
        console.log("username must contains only letters");
        return false;
    }
    if (userName.length > 8 || userName.length < 3) {
        //alert user name have to includes between 3-8 chars
        console.log("user name have to includes between 3-8 chars");
        return false;
    }
    return true;
}
//check valid password
function checkPassword(password) {
    //let pattern = /[a-zA-Z]+[(@!#\$%\^\&*\)\(+=._-]{1,}/;
    // if (!validate.isAlphanumeric(password, 'en-US')) {
    //     console.log("Not an alphanumeric");
    //     return false;
    // }
    if (password.length > 8 || password.length < 3) {
        //alert password have to includes between 3-8 chars
        console.log("password must to includes between 3-8 chars");
        return false;
    }
    return true;
}

function checkCountry(country){
    let xml = fs.readFile("countries.xml",function(err, data){

    } )
} 
