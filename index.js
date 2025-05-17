const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection URI
require('dotenv').config();

const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const db = client.db('jobPortalDB');
        const jobsCollection = db.collection('jobs');
        const applicationsCollection = db.collection('applications');
        const notificationsCollection = db.collection('notifications');

        // console.log("Connected to MongoDB!");


        //  multer storage for file uploads
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'uploads/'); // files will be saved to /uploads folder
            },
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + path.extname(file.originalname));
            }
        });
        const upload = multer({ storage: storage });

        //  POST route to create a job
        app.post('/jobs', upload.single('companyLogo'), async (req, res) => {
            try {
                const { companyName, designation, salary, location, hours, responsibilities } = req.body;
                const companyLogo = req.file ? req.file.filename : null;

                const jobData = {
                    companyName,
                    designation,
                    salary: parseFloat(salary),
                    location,
                    hours,
                    responsibilities,
                    companyLogo,
                    createdAt: new Date(),
                };

                const result = await jobsCollection.insertOne(jobData);
                res.status(201).send({ success: true, message: 'Job posted successfully', jobId: result.insertedId });
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Failed to post job' });
            }
        });

        //  GET route to retrieve all jobs
        // app.get('/jobs', async (req, res) => {
        //     try {
        //         const jobs = await jobsCollection.find().toArray();
        //         res.send(jobs);
        //     } catch (err) {
        //         console.error(err);
        //         res.status(500).send({ success: false, message: 'Failed to get jobs' });
        //     }
        // });

        app.get('/jobs', async (req, res) => {
            try {
                const jobs = await jobsCollection.find().toArray();
                res.json(jobs);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to fetch jobs' });
            }
        });

        //  GET route to retrieve a specific job by ID
        app.get('/jobs/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const job = await jobsCollection.findOne({ _id: new ObjectId(id) });

                if (!job) {
                    return res.status(404).send({ success: false, message: 'Job not found' });
                }

                res.send(job);
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Failed to get job' });
            }
        });

        //  POST route to apply for a job
        // app.post('/apply/:jobId', async (req, res) => {
        //     const jobId = req.params.jobId;
        //     const userId = req.body.userId; // The applicant (Y)

        //     try {
        //         // Find the job by ID
        //         const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });

        //         if (!job) {
        //             return res.status(404).send({ success: false, message: 'Job not found' });
        //         }

        //         // Check if the user trying to apply is the same as the job poster
        //         if (job.userId === userId) {
        //             return res.status(400).send({ success: false, message: 'You cannot apply for your own job' });
        //         }

        //         // Save the application
        //         const applicationData = {
        //             jobId,
        //             userId,
        //             resumeLink: req.body.resumeLink,
        //             appliedAt: new Date(),
        //         };

        //         await applicationsCollection.insertOne(applicationData);

        //         // Notify the job poster (X) that someone has applied
        //         const notificationData = {
        //             userId: job.userId, // This is X, the job poster
        //             message: `You have a new application for the job: ${job.designation}`,
        //             jobId,
        //             createdAt: new Date(),
        //         };

        //         await notificationsCollection.insertOne(notificationData);

        //         res.status(201).send({ success: true, message: 'Application submitted successfully' });
        //     } catch (err) {
        //         console.error(err);
        //         res.status(500).send({ success: false, message: 'Failed to apply for the job' });
        //     }
        // });

        app.post('/jobs', upload.single('companyLogo'), async (req, res) => {
            try {
                const { companyName, designation, salary, location, hours, responsibilities, userId } = req.body;  // add userId here
                const companyLogo = req.file ? req.file.filename : null;

                const jobData = {
                    companyName,
                    designation,
                    salary: parseFloat(salary),
                    location,
                    hours,
                    responsibilities,
                    companyLogo,
                    // userId,
                    createdAt: new Date(),
                };

                const result = await jobsCollection.insertOne(jobData);
                res.status(201).send({ success: true, message: 'Job posted successfully', jobId: result.insertedId });
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Failed to post job' });
            }
        });



        // GET route to retrieve notifications for a user (X)
        app.get('/notifications/:userId', async (req, res) => {
            const { userId } = req.params;

            try {
                const notifications = await notificationsCollection.find({ userId }).toArray();
                res.send(notifications);
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Failed to fetch notifications' });
            }
        });



    } catch (err) {
        console.error(err);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Job Portal server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
