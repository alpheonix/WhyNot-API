var express = require('express');
var router = express.Router();

const {MongoClient} = require('../../config');
const {MONGODB_URI} = require('../../config');
const {dbName} = require('../../config');
const {BASEAPPURL} = require('../../config');

const {verifyTokenAdmin} = require('../../middleware.js');
const {verifyToken} = require('../../middleware.js');
const {ObjectId} = require('../../config.js');
const {dateNow} = require('../../config');
const {upload} = require('../../config');

router.get('/', verifyToken, async (req, res, next) => {
    let result;
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('events');
        switch (req.query.sub_only) {
            case "true":
                result = await col.find({sub_only: true}).toArray();
                break;
            case "false":
                result = await col.find({sub_only: false}).toArray();
                break;
            default:
                result = await col.find({}).toArray();
                break;
        }
        res.send({
            events: result,
            error: null

        });
    } catch (err) {
        res.send(err);
    }
    client.close();
});

router.get('/myevents/', verifyToken, async (req, res, next) => {
    let result;
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('register');
        const eventCol = db.collection('events');
        let result1 = await col.find({
            userId: req.token._id,
            isUnregistered:false

        }).toArray();
        if (result1.length !== 0) {
            result = await eventCol.find({_id: ObjectId(result1[0].eventId)}).toArray();
        }
        res.send({
            events: result,
            error: null

        });
    } catch (err) {
        res.send(err);
    }
    client.close();
});

router.get('/register', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('register');
        let result = await col.find({}).toArray();
        res.send({
            events: result,
            error: null

        });
    } catch (err) {
        res.send(err);
    }
    client.close();
});

router.get('/:id', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('events');
        let result = await col.find({_id: ObjectId(req.params.id)}).toArray();
        res.send({
            event: result,
            error: null
        });
    } catch (err) {
        res.send(err);
    }
    client.close();
});

router.put('/', verifyTokenAdmin, upload.single('image'), async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('events');
        await col.insertOne({
            name: req.body.name,
            description: req.body.description,
            address: req.body.address,
            date: req.body.date,
            imageURL: BASEAPPURL + req.file.path,
            price: parseInt(req.body.price),
            sub_only: JSON.parse(req.body.sub_only),
            createdBy: req.token._id,
            createdAt: dateNow(),
            updatedAt: null
        });
        res.send({
            error: null
        });
    } catch (err) {
        res.send(err);
    }
    client.close();
});

router.patch('/:id', verifyTokenAdmin, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('events');

        const name = req.body.name;
        const description = req.body.description;
        const address = req.body.address;
        const date = req.body.date;
        const imageURL = req.body.imageURL;
        const price = req.body.price;
        const sub_only = req.body.sub_only;
        const updatedAt = dateNow();
        let eventResult = await col.find().toArray();
        let resultForEach = 0;
        let event;

        eventResult.forEach((resForEach) => {
            if (resForEach._id.equals(req.params.id)) {
                resultForEach = 1;
                event = resForEach;
            }
        });
        if (resultForEach === 0) {
            res.status(404).send({error: 'L\'event n\'existe pas'});
        } else {
            let insertResult = await col.updateOne(
                {_id: ObjectId(req.params.id)},
                {
                    $set: {
                        name,
                        description,
                        address,
                        date,
                        imageURL,
                        price,
                        sub_only,
                        updatedAt
                    }
                });
            let newEvent = await col.find({_id: ObjectId(req.params.id)}).toArray();
            res.send({
                newEvent,
                error: null
            });
        }
    } catch (err) {
        res.send({error: err});
    }
    client.close();
});

router.delete('/:id', verifyTokenAdmin, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('events');
        let eventResult = await col.find().toArray();
        let resultForEach = 0;
        let event;
        eventResult.forEach((resForEach) => {
            if (resForEach._id.equals(req.params.id)) {
                resultForEach = 1;
                event = resForEach;
            }
        });
        if (resultForEach === 0) {
            res.status(404).send({error: 'L\'event n\'existe pas'});
        } else {
            await col.deleteOne({_id: event._id});
            res.send({
                error: null
            });
        }
    } catch (err) {
        res.send({error: err});
    }
    client.close();
});

router.post('/register', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('register');
        let result1 = await col.find({
            userId: req.token._id,
            isUnregistered:false
        }).toArray();
        console.log(result1);
        if (!result1[0]) {
            await col.insertOne({
                userId: req.token._id,
                eventId: req.body.eventId,
                createdAt: dateNow(),
                isUnregistered: false
            });
        }else{
            res.status(400).send({error: 'Vous etes deja inscrit a cet event'});

        }
        
        let result = await col.find({}).toArray();
        res.send({
            result
        })
    } catch (err) {
        res.send({error: err});
    }
    client.close();
});

router.post('/usregister', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('register');
        let result1 = await col.find({
            userId: req.token._id,
            eventId :req.body.eventId,
            isUnregistered:false
        }).toArray();
        console.log(result1);
        if (result1[0]) {
            console.log("test");
            
            let insertResult = await col.updateOne(
                {userId:req.token._id ,eventId:req.body.eventId, isUnregistered:false},
                {$set: {
                    isUnregistered:true
                
            }});
        }else{
            res.status(400).send({error: "Vous n'etes pas encore inscrit a cet event"});

        }
        
        let result = await col.find({}).toArray();
        res.send({
            result
        })
    } catch (err) {
        res.send({error: err});
    }
    client.close();
});


module.exports = router;