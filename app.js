var express = require('express');
var app = express();
var DButilsAzure = require('./DButils');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var parser = require('xml2json')
var cors = require('cors');


var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

app.use(cors());
app.options('*',cors());

app.use(require('body-parser').json())

let xml = fs.readFile("./countries.xml", function (err, data) {
    countries = JSON.parse(parser.toJson(data))
});

secret = "ourSecret<3";

app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use("/private", (req, res, next) => {
    const token = req.header("x-auth-token");
    // no token
    if (!token) res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        // req.userName = req.decoded.name;
        next();
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
});

app.get('/getPoint', function (req, res) {
    let pointName = req.query.pointName;
    DButilsAzure.execQuery("SELECT top (2) p.[NAME] , p.[PICTURE] ,p.[description], p.[rank], p.[numofviews] , CASE WHEN r.[review] IS NOT NULL THEN r.[review] ELSE 'NO REVIEW TO SHOW'  END AS [REVIEW] , r.[DATE] FROM [points] p left join [reviews] r on p.[id]=r.[pointid] where p.[name] = '" + pointName + "' order by r.[date] ASC ")
        .then(function (result) {
            if (result.length == 0) {
                res.send("no points to show");
            } else {
                res.send(result)
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})


//login
app.post('/logIn', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    let userName = req.body.userName;
    let password = req.body.password;

    DButilsAzure.execQuery(
        "SELECT * FROM [dbo].[Passwords] P WHERE P.[USERNAME] = '" + userName + "' AND P.[PASSWORD] = '" + password + "'")
        .then(function (result) {
            if (result.length > 0) {
                payload = { name: userName };
                options = { expiresIn: "1d" };
                const token = jwt.sign(payload, secret, options);
                res.send(token)
            } else {
                res.send("one or more of your inputs are wrong")
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//restore password
app.post('/restorePassword', function (req, res) {
    let userName = req.body.userName;
    let question = req.body.question;
    let answer = req.body.answer;
    DButilsAzure.execQuery(
        "IF ( SELECT COUNT (*) FROM [dbo].[Questions] Q WHERE Q.[USERNAME] = '" + userName + "' AND Q.[QUESTION] = '" + question + "' AND Q.[ANSWER] = '" + answer + "') = 1 SELECT * FROM [dbo].[Passwords] P WHERE P.[USERNAME] = '"+ userName + "'")
        .then(function (result) {
            if(result.length > 0){
                res.send(result)
            }
            else{
                res.send("one or more of your inputs are wrong")
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//add favorite point for a user
app.put('/private/addSavePoint', function (req, res) {
    let userName = req.decoded.name;
    let pointName = req.query.pointName;
    let index = req.query.i;
    DButilsAzure.execQuery(
        "DECLARE @ID AS INT SET @ID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') INSERT INTO FavoritesPoint(USERNAME, [POINTID], [INDEX], DATE) VALUES('" + userName + "', @ID," + index + ", GETDATE())")
        .then(function (result) {
            res.send("add favorite point done")
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//get last two saved points of user.
app.get('/private/getLastTwoSavedPoints', function (req, res) {
    let userName = req.decoded.name;
    DButilsAzure.execQuery(
        "SELECT top (2) p.[name] FROM [points] p inner join [favoritesPoint] f on f.[pointid]=p.[id] where f.[userName] = '" + userName + "' order by f.[date] desc ")
        .then(function (result) {
            if (result.length == 0) {
                res.send("no points saved");
            } else {
                res.send(result)
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//delete a favorite point of a user.
app.delete('/private/deleteSavedPoint', function (req, res) {
    let userName = req.decoded.name;
    let pointName = req.query.pointName;
    DButilsAzure.execQuery(
        "DECLARE @ID AS INT SET @ID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') SELECT * FROM [FavoritesPoint] WHERE [POINTID] = @ID AND [USERNAME] = '" + userName + "' DELETE FROM [FavoritesPoint]  WHERE [POINTID] = @ID AND [USERNAME] = '" + userName + "'")
        .then(function (result) {
            if(result.length > 0){
                res.send("done delete favorite point.")
            }
            else{
                res.send("no point to delete.")
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//get the number of saved points of a user.
app.get('/private/getNumSavedPoints', function (req, res) {
    let userName = req.decoded.name;
    DButilsAzure.execQuery(
        "SELECT COUNT(*) FROM FAVORITESPOINT WHERE USERNAME = '" + userName + "'")
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//get all saved points of a user.
app.get('/private/getSavedPoints', function (req, res) {
    let userName = req.decoded.name;
    DButilsAzure.execQuery(
        "select p.[ID], p.[NAME], p.[PICTURE], p.[DESCRIPTION], p.[RANK], p.[CITY], p.[CATEGORY], p.[NUMOFVIEWS] from [dbo].[Points] p inner join [FavoritesPoint] f on p.ID=f.POINTID where f.[USERNAME]= '" + userName + "' order by f.[index] asc")
        .then(function (result) {
            if (result.length == 0) {
                res.send("no points to show");
            } else {
                res.send(result)
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//add new review to point.
app.put('/private/addReview', function (req, res) {
    let userName = req.decoded.name;
    let pointName = req.query.pointName;
    let review = req.query.review;
    DButilsAzure.execQuery(
        "DECLARE @RID1 AS INT SET @RID1 =  0 SET @RID1 = (SELECT COUNT(*) FROM [REVIEWS] R ) DECLARE @RID AS INT SET @RID = 0 IF (@RID1 > 0) BEGIN SET @RID = ((SELECT TOP (1) [ID] FROM [REVIEWS] R ORDER BY R.[ID] desc) + 1) END DECLARE @PID AS INT SET @PID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') INSERT INTO REVIEWS(ID, USERNAME, POINTID, REVIEW, [DATE]) VALUES(@RID, '" + userName + "', @PID, '" + review + "', GETDATE()) SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "'")
        .then(function (result) {
            if(result.length > 0){
                res.send("done add new review")
            }
            else{
                res.send("no such point")
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//get all points.
app.get('/getAllPoints', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    DButilsAzure.execQuery(
        "SELECT * FROM POINTS")
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//get all points by category.
app.get('/getPointsByCatagory', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    let category = req.query.category;
    DButilsAzure.execQuery(
        "SELECT * FROM POINTS WHERE CATEGORY = '" + category + "'")
        .then(function (result) {
            if(result.length > 0){
                res.send(result)
            }
            else{
                res.send("no such category")
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})


app.put('/private/addRank', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    let pointName = req.query.pointName;
    let rank = req.query.rank;
    if (rank < 0 || rank > 5) {
        res.send("The rank must be between 1 to 5")
    }
    else {
        DButilsAzure.execQuery(
            "DECLARE @ID AS INT SET @ID = (SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') DECLARE @NUM AS INT SET @NUM = (SELECT NUMOFRANKS FROM [RANKS] R WHERE R.[POINTID] = @ID) DECLARE @LASTRANK AS FLOAT SET @LASTRANK = (SELECT [RANK] FROM [POINTS] P WHERE P.[ID] = @ID) DECLARE @NEWRANK AS FLOAT SET @NEWRANK = ((@LASTRANK*@NUM) + " + rank + ")/(@num + 1) UPDATE T SET T.[RANK] = @NEWRANK FROM POINTS T WHERE T.[ID] = @ID UPDATE F SET F.[NUMOFRANKS] = (@NUM+1) FROM RANKS F WHERE F.[POINTID] = @ID SELECT ID FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "'")
            .then(function (result) {
                if(result.length > 0){
                    res.send("done rank the point")
                }
                else{
                    res.send("no such point")
                }
            })
            .catch(function (err) {
                console.log(err)
                res.send(err)
            })
    }
})


app.get('/getRandomPoints', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    let minimalRank = req.query.minimalRank;
    if (minimalRank < 0 || minimalRank > 5) {
        res.send("The minimal rank must be between 1 to 5")
    }
    else {
        DButilsAzure.execQuery(
            "SELECT * FROM POINTS P WHERE P.[RANK] >= " + minimalRank + "")
            .then(function (result) {
                if (result.length > 3) {
                    let random1 = Math.floor(Math.random() * (result.length - 1 + 1) + 1);
                    let random2 = Math.floor(Math.random() * ((result.length - 1) - 1 + 1) + 1);
                    if (random1 == random2) {
                        if (random1 != 0) {
                            random2 -= 1;
                        } else {
                            random2 += 1;
                        }
                    }
                    let random3 = Math.floor(Math.random() * ((result.length - 2) - 1 + 1) + 1);
                    if (random2 == random3) {
                        if (random3 != 0) {
                            random3 -= 1;
                        }
                        else {
                            random3 += 1;
                        }
                    }
                    res.send(JSON.stringify(result[random1]) + "\n" + JSON.stringify(result[random2]) + "\n" + JSON.stringify(result[random3]));
                    console.log(result[random1]);
                }
                else {
                    res.send(result);
                }

            })
            .catch(function (err) {
                console.log(err)
                res.send(err)
            })
    }
})

app.get('/private/getTwoPopularPoints', function (req, res) {
    let userName = req.decoded.name;
    DButilsAzure.execQuery("DECLARE @CATEGORY1 AS NVARCHAR (100) DECLARE @CATEGORY2 AS NVARCHAR (100) SET @CATEGORY1 = (SELECT TOP (1) F.[CATEGORY] FROM [FavoritesCategories] F WHERE F.[USERNAME]='" + userName + "' ORDER BY F.[CATEGORY] DESC ) SET @CATEGORY2 = (SELECT TOP (1) F.[CATEGORY] FROM [FavoritesCategories] F WHERE F.[USERNAME]='" + userName + "' ORDER BY F.[CATEGORY] ASC ) SELECT TOP (1) [NAME] FROM [POINTS] P1 WHERE P1.[CATEGORY] = @CATEGORY1 SELECT TOP (1) [NAME] FROM [POINTS] P2 WHERE P2.[CATEGORY] = @CATEGORY2")
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})

//increase by 1 the number of views of a point.
app.put('/increaseNumOfViews', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    let pointName = req.query.pointName;
    DButilsAzure.execQuery(
        "DECLARE @NUM AS INT SET @NUM = (SELECT NUMOFVIEWS FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "') UPDATE T SET T.[NUMOFVIEWS] = (@NUM+1) FROM POINTS T WHERE T.[NAME] = '" + pointName + "' SELECT NUMOFVIEWS FROM [POINTS] P WHERE P.[NAME] = '" + pointName + "'")
        .then(function (result) {
            if(result.length > 0){
                res.send("done increase the number of views.")
            }
            else{
                res.send("no such point.")
            }
        })
        .catch(function (err) {
            console.log(err)
            res.send(err)
        })
})


//register
app.post('/register', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization");

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
    if (checkPassword(password) && checkUserName(userName) && checkCountry(country) && checkEmail(email)) {
        //USER CREATION 
        DButilsAzure.execQuery("INSERT INTO USERS VALUES ('" + userName + "','" + firstName + "', '" + lastName + "', '" + city + "' , '" + country + "' , '" + email + "') INSERT INTO Passwords VALUES ('" + userName + "' , '" + password + "' ) INSERT INTO FavoritesCategories VALUES ('" + userName + "' , '" + domain1 + "') INSERT INTO FavoritesCategories VALUES ('" + userName + "' , '" + domain2 + "') INSERT INTO Questions VALUES('" + userName + "' , '" + question + "', '" + answer + "' )")
            .then(function (result) {
                res.send("Insert new user done.")
            })
            .catch(function (err) {
                console.log(err)
                res.send(err)
            })
    }
    else {
        res.send("one or more of your inputs are wrong")
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
    var patternPswd = /^(?!^[0-9]*$)(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{3,8})$/;
    if (!patternPswd.test(password)) {
        console.log("password must to includes between 3-8 chars, and contain letters and numbers");
        return false;
    }
    return true;
}

function checkCountry(country) {
    for(var i = 0; i < countries.Countries.Country.length; i++){
        if(countries.Countries.Country[i].Name == country){
            return true;
        }
    }
    return false;
} 

function checkEmail(email) {
    var patternEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!patternEmail.test(email)) {
        console.log("the email you insert is not valid");
        return false;
    }
    return true;
} 
