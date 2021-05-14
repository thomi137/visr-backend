const express = require('express');
const router = express.Router();
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

    router.post('/upload', multer.single('file'), async (req, res, next) => {
        
        try {
            if(!req.file) {
                res.status(400)
                .send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {
           
                const blob = bucket.file(req.file.originalname);
                const blobStream = blob.createWriteStream();
                blobStream.on('error', err => {
                    next(err);
                });
    
                blobStream.on('finish', async () => {
                    // The public URL can be used to directly access the file via HTTP.
                    const publicUrl = format(
                      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
                    );
                  
                    await blob.makePublic();
                    const wRes = await datastore.collection('images').add({
                        name: blob.name,
                        url: publicUrl
                    });
                    console.log(wRes);
                    res.status(200).json({ 
                        publicUrl,
                        id: wRes.id,
                        path: wRes.path 
                    });
                  });
                
                  blobStream.end(req.file.buffer);
    
            }
        } catch (err) {
            res.status(500).send(err);
        }
    });

    return router;
}