//TEST PROD

var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');


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

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: 'arthurblanc98@gmail.com',
           pass: '4kfe6fp.gmail'
       }
   });

router.get('/', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    console.log(req.token._id);  
    console.log(req.token.preference);  
    console.log(req.token.gender); 
    console.log(req.token.name);        
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('users');
        let result;
        if (req.token.preference === 2) {
            result = await col.find({
                _id: {
                    $not: {
                        $elemMatch: {
                            _id: ObjectId(req.tokzn._id)
                        }
                    }
                },
                viewers: {
                    $not: {
                        $elemMatch: {
                            _id: req.token._id
                        }
                    }
                },
                preference: 2 ,
                film: req.token.film,
                activite: req.token.activite,
                musique: req.token.musique,
            }).toArray();
        } else {
            result = await col.find({
                _id: {$nin: [ObjectId(req.token._id)]},
                gender: req.token.preference,
                preference: req.token.gender,
                film: req.token.film,
                activite: req.token.activite,
                musique: req.token.musique,
                viewers: {
                    $not: {
                        $elemMatch: {
                            _id: req.token._id
                        }
                    }
                }
            }).toArray();
        }
        console.log();
        
        res.send(result);
    } catch (err) {
        res.send({
            error: err
        });
    }
    client.close();
});

router.get('/login', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('users');
        let result = await col.find().toArray();
        res.send(result);
    } catch (err) {
        res.send({
            error: err
        });
    }
    client.close();
});

router.patch('/viewers', verifyToken, async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('users');
        let insertResult = await col.updateOne(
            {_id: ObjectId(req.query._id)},
            {
                $push: {
                    viewers: {
                        _id: req.token._id
                    }
                }
            });
        res.send({
            error: null
        });
    } catch (err) {
        res.send({
            error: err
        })
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
                    gender: result[0].gender,
                    preference: result[0].preference,
                    film: result[0].film,
                    activite: result[0].activite,
                    musique: result[0].musique,
                }, JWT_KEY, {expiresIn: '24h'}, (err, token) => {
                    if (err) {
                        res.send({error: 'error'});
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
router.post('/signup', upload.single('image'), async function (req, res, next) {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('users');
    //INSERT ONE DOCUMENT
    let data = await col.find({}).toArray();
    if (!validator.validate(req.body.email)) {
        res.status(400).send({error: 'Email invalide'});
    } else if (!isUsernameValid(req.body.username)) {
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
            photo: BASEAPPURL + req.file.path,
            birthdate: req.body.birthdate,
            gender: parseInt(req.body.gender),
            preference: parseInt(req.body.preference),
            film: parseInt(req.body.film),
            musique: parseInt(req.body.musique),
            activite: parseInt(req.body.activite),
            bio: req.body.bio,
            twitter: req.body.twitter,
            insta: req.body.insta,
            facebook: req.body.facebook,
            viewers: [],
            createdAt: dateNow(),
            updatedAt: null,
            isDeleted: false,
            reported: false,
            banned: false

        });
        const mailOptions = {
            from: 'arthurblanc98@gmail.com', // sender address
            to: 'alpheonixminecraft@gmail.com', // list of receivers
            subject: 'Bienvenue', // Subject line
            html: '<p>Bienvenu sur Why not </p>'// plain text body
          };
    console.log(mailOptions);
    
          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
              console.log(err)
            else
              console.log(info);
         });
         console.log("fin");
         
        let result = await col.find({username: req.body.username, password: md5(req.body.password)}).toArray();
        jwt.sign({
            _id: result[0]._id,
            email: result[0].email,
            username: result[0].username,
            gender: result[0].gender,
            preference: result[0].preference,
            film: result[0].film,
            activite: result[0].activite,
            musique: result[0].musique,
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

router.post('/modify', verifyToken,upload.single('image'), async function (req, res, next) {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('users');
    //INSERT ONE DOCUMENT
    if (!validator.validate(req.body.email)) {
        res.status(400).send({error: 'Email invalide'});
    } else if (!isUsernameValid(req.body.username)) {
        res.status(400).send({error: 'Le nom d\'utilisateur ne doit contenir uniquement des lettres'});
    }  else {
        //INSERT ONE DOCUMENT
        await col.updateOne(
            {_id: ObjectId(req.token._id)},{
                $set: {
                    email: req.body.email,
                    username: req.body.username,
                    photo: BASEAPPURL + req.file.path,
                    preference: parseInt(req.body.preference),
                    film: parseInt(req.body.film),
                    musique: parseInt(req.body.musique),
                    activite: parseInt(req.body.activite),
                    twitter: req.body.twitter,
                    insta: req.body.insta,
                    facebook: req.body.facebook,
                    bio: req.body.bio,
                    updatedAt: dateNow(),
        
                }
            }
            );
        let result = await col.find({username: req.body.username, email: req.body.email}).toArray();
        jwt.sign({
            _id: result[0]._id,
            email: result[0].email,
            username: result[0].username,
            gender: result[0].gender,
            preference: result[0].preference,
            film: result[0].film,
            activite: result[0].activite,
            musique: result[0].musique,
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

/* DELETE user */
router.delete('/:id', async (req, res, next) => {
    const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
    try {
        await client.connect();
        const db = client.db(dbName);
        const col = db.collection('users');
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
            res.status(404).send({error: 'L\'utilisateur n\'existe pas'});
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


module.exports = router;
