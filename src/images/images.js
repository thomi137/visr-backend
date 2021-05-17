const express = require('express');
const path = require('path');
const router = express.Router();
const _ = require('lodash');
const { format } = require('util');
const Multer = require('multer');

module.exports = (firebaseAdmin) => {

    const bucket = firebaseAdmin.storage().bucket();
    const datastore = firebaseAdmin.firestore();

    const multer = Multer({
        storage: Multer.memoryStorage(),
        limits: {
        fileSize: 20 * 1024 * 1024,
        },
    });

    router.get('/', async (req, res, next) => {
        try {
            const query = await datastore.collection('images').get();
            const urls = [];
            query.forEach((doc) => {
                urls.push({ id: doc.id, ...doc.data()});
            });

            if(urls.length > 0) {
                res.json(urls);
            } else {
                res.status(404).send({message: 'No images found'});
            }
        } catch (error) {
            res.status(500).send({message: error.message});
        }
    });

    router.get('/:id', async (req, res, next) => {
        try {
            const image = await datastore.doc(`images/${req.params.id}`).get();
            if(image.exists) {
                res.json(image.data());
            } else {
                res.status(404).json({message: 'Image not found'});
            }
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    });

    router.patch('/:id', async (req, res, next) => {
        const id = req.params.id;
        const body = req.body
        if(_.isEmpty(body)) {
            res.status(204).send()
        }
        try {
            const docRef = datastore.collection('images').doc(id);
            await docRef.set(body, {merge: true});
            const updatedDoc = await docRef.get();
            res.json(updatedDoc.data());
        } catch (error) {
            console.log(error);
            res.status(500).send({message: error.message});
        }
    });

    router.post('/upload', multer.single('file'), async (req, res, next) => {
        
        try {
            if(!req.file) {
                res.status(400)
                .send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {
                const docRef = datastore.collection('images').doc();
                const id = docRef.id;
                const ext = path.extname(req.file.originalname);
                const savedFilename = `${id}${ext}`;

                const blob = bucket.file(savedFilename);
                const blobStream = blob.createWriteStream();
                blobStream.on('error', err => {
                    next(err);
                });
    
                blobStream.on('finish', async () => {
                    // The public URL can be used to directly access the file via HTTP.
                    const publicUrl = format(
                      `https://storage.googleapis.com/${bucket.name}/${savedFilename}`
                    );
                  
                    await blob.makePublic();
                    const imageData = {
                        id,
                        title: req.file.originalname,
                        savedFilename,
                        publicUrl
                    }
                    const wRes = await docRef.set(imageData);
                    console.log(wRes);
                    res.status(200).json(imageData);
                  });
                
                  blobStream.end(req.file.buffer);
    
            }
        } catch (error) {
            res.status(500).send({message: error.message});
        }
    });

    router.delete('/:id', async (req, res, next) => {
        const id = req.params.id;

        try {
            const snapshot = await datastore.collection('images').doc(id).get();
            const fileName = snapshot.data().savedFilename;
            await bucket.file(fileName).delete();
            await datastore.collection('images').doc(id).delete()
            res.status(200).json({message: `Image ${id} deleted.`})
        } catch (error) {
            console.log(error);
            res.status(500).send({message: error.message});
        }

    });

    return router;
}