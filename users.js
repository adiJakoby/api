

app.get('/getPoint', function(req, res){
    var pointName = req.pointName;
    DButilsAzure.execQuery("SELECT description, rank, numofviews FROM points WHERE name=pointName")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
})