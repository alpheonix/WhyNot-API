//TEST PROD

var express = require('express');
var router = express.Router();

const {MongoClient} = require('../../config');
const {MONGODB_URI} = require('../../config');
const {JWT_KEY} = require('../../config');
const {dbName} = require('../../config');
const {BASEAPPURL} = require('../../config');
const {jwt} = require('../../config');
const {ObjectId} = require('../../config');
const {verifyToken} = require('../../middleware');
const {isUsernameValid} = require('../../config');
const {md5} = require('../../config');
const {dateNow} = require('../../config');
const {validator} = require('../../config');
const {upload} = require('../../config');

router.get('/', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('match');
        const userCol = db.collection('users');
        let result = [];
        console.log(req.token._id);
        let result1 = await col.find({
            user1: req.token._id
        }).toArray();
        let result2 = await col.find({
            user2: req.token._id
        }).toArray();
        
        if (result1 !== 0) {
            for (let x = 0; x < result1.length; x++) {
                let finalUsersTab = await userCol.find({_id: ObjectId(result1[x].user2)}).toArray();
                if (finalUsersTab.length !== 0) {
                    result.push(finalUsersTab[0]);
                }
            }
        }
        
        if (result2 !== 0) {
            for (let x = 0; x < result2.length; x++) {
                let finalUsersTab = await userCol.find({_id: ObjectId(result2[x].user1)}).toArray();
                if (finalUsersTab.length !== 0) {
                    result.push(finalUsersTab[0]);
                }
            }
        }
        console.log(result);
        
        res.send(result);
    } catch (err) {
        res.send({
            error: err
        });
    }
    client.close();
});

module.exports = router;