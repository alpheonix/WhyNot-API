var express = require('express');
var router = express.Router();

const {MongoClient} = require('../config');
const {MONGODB_URI} = require('../config');
const {JWT_KEY} = require('../config');
const {dbName} = require('../config');
const {jwt} = require('../config');
const {isUsernameValid} = require('../config');
const {md5} = require('../config');
const {dateNow} = require('../config');
const {validator} = require('../config');

/* GET users listing. */
router.get('/login', async function (req, res, next) {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('users');
        let result = await col.find({}).toArray();
        console.log(result);
        res.send({
            users: result
        });
    } catch (err) {
        res.send({
            error: err
        });
    }
    client.close();
});

/* SIGN IN */
router.post('/login', async function (req, res) {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('users');
        if (!validator.validate(req.body.email)) {
            res.status(400).send({error: 'Email invalide'});
        } else if (req.body.password.length < 5) {
            res.status(400).send({error: 'Le mot de passe doit contenir au moins 5 caractères'});
        } else {
            var result = await col.find({email: req.body.email, password: md5(req.body.password)}).toArray();
            if (result.length) {
                jwt.sign({
                    _id: result[0]._id,
                    email: result[0].email,
                    username: result[0].username,
                    sexe: result[0].sexe,
                    preference: result[0].preference
                }, JWT_KEY, {expiresIn: '24h'}, (err, token) => {
                    if (err) {
                        res.send({message: 'error'});
                    } else {
                        res.send({
                            token,
                            error: null
                        });
                    }
                });
            } else {
                res.status(403).send({
                    error: 'Cet identifiant ou mot de passe est inconnu'
                });
            }
        }
    } catch (err) {
        res.send({
            error: err
        })
    }
    client.close();
});

/* POST users */
router.post('/signup', async function (req, res, next) {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('users');
    //INSERT ONE DOCUMENT
    let data = await col.find({}).toArray();
    if (!validator.validate(req.body.email)) {
        res.status(400).send({error: 'Email invalide'});
    } else if(!isUsernameValid(req.body.username)){
        res.status(400).send({error: 'Le nom d\'utilisateur ne doit contenir uniquement des lettres'});
    } else if (req.body.password.length < 5) {
        res.status(400).send({error: 'Le mot de passe doit contenir au moins 5 caractères'});
    } else if (data.some(data => data.email === req.body.email)) {
        res.status(400).send({error: 'Cet email est déjà associé à un compte'});
    } else {
        //INSERT ONE DOCUMENT
        await col.insertOne({
            email: req.body.email,
            username: req.body.username,
            password: md5(req.body.password),
            photo: req.body.photo,
            birthdate: req.body.birthdate,
            sexe: req.body.sexe,
            preference: req.body.preference,
            bio: req.body.bio,
            createdAt: dateNow(),
            updatedAt: null,
            isDeleted: false
        });
        let result = await col.find({username: req.body.username, password: md5(req.body.password)}).toArray();
        jwt.sign({
            _id: result[0]._id,
            email: result[0].email,
            username: result[0].username,
            sexe: result[0].sexe,
            preference: result[0].preference
        }, JWT_KEY, {expiresIn: '24h'}, (err, token) => {
            if (err) {
                res.send({message: 'error'});
            } else {
                res.send({
                    token,
                    error: null
                });
            }
        });
    }
});

module.exports = router;
