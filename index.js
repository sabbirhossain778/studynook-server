const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
dotenv.config();
const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 8000


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
        // await client.db("admin").command({ ping: 1 });

        const db = client.db('studynook-db');
        const roomsCollection = db.collection('rooms');

        const bookingsCollection = client.db('studynook-db').collection('bookings');

        app.get('/all-rooms', async (req, res) => {
            const cursor = roomsCollection.find();
            const result = await cursor.toArray();
            res.send(result)

        })

        app.get('/all-rooms/:roomId', async (req, res) => {
            const { roomId } = req.params;
            const query = { _id: new ObjectId(roomId) }
            const result = await roomsCollection.findOne(query);
            res.send(result)
        })

        app.get('/featured-rooms', async (req, res) => {
            const cursor = roomsCollection.find().sort({ _id: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/add-room', async (req, res) => {
            try {
                const roomData = req.body;
                // console.log('Received Room Data:', roomData);

                const result = await roomsCollection.insertOne(roomData);
                res.status(201).json(result);
            } catch (error) {
                console.error("Database Insert Error:", error);
                res.status(500).json({ error: "Failed to insert room data" });
            }
        });

        app.get('/my-listings', async (req, res) => {
            try {
                const email = req.query.email;
                const query = { userEmail: email };
                const result = await roomsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching rooms:", error);
                res.status(500).send({ error: "Failed to fetch rooms" });
            }
        });


        app.delete('/all-rooms/:id', async (req, res) => {
            const id = req.params.id;
            const userEmail = req.query.email;

            const room = await roomsCollection.findOne({ _id: new ObjectId(id) });
            if (!room || room.userEmail !== userEmail) {
                return res.status(403).json({ error: "Unauthorized: You don't own this room!" });
            }

            const query = { _id: new ObjectId(id) };
            const result = await roomsCollection.deleteOne(query);
            res.send(result);
        });

        app.patch("/all-rooms/:id", async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;
            const userEmail = req.query.email;

            // email check
            const room = await roomsCollection.findOne({ _id: new ObjectId(id) });
            if (!room || room.userEmail !== userEmail) {
                return res.status(403).json({ error: "Unauthorized: You don't own this room!" });
            }

            const result = await roomsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.json(result);
        });



        // my bookings
        app.post('/my-bookings', async (req, res) => {
            const bookingData = req.body;
            const { roomId, date, startTime, endTime } = bookingData;

            const existingConflict = await bookingsCollection.findOne({
                roomId: roomId,
                date: date,
                $or: [
                    {
                        startTime: { $lt: endTime },
                        endTime: { $gt: startTime }
                    }
                ]
            });

            if (existingConflict) {
                return res.status(400).json({ error: "This time slot is already booked for this room!" });
            }

            // booking save
            const result = await bookingsCollection.insertOne({
                ...bookingData,
                createdAt: new Date()
            });

            res.status(201).json({ success: true, result });
        });

        app.get('/my-bookings', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        });

        app.patch('/bookings/:id/cancel', async (req, res) => {
            const { id } = req.params;
            const userEmail = req.query.email;

            const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
            if (!booking || booking.userEmail !== userEmail) {
                return res.send({ error: "Unauthorized" });
            }

            const result = await bookingsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: "cancelled" } }
            );

            await roomsCollection.updateOne(
                { _id: new ObjectId(booking.roomId) },
                { $inc: { bookingCount: -1 } }
            );

            res.json(result);
        });



        

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World! Hello World! Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


