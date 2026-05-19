const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
dotenv.config();
const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 8000

// tE62LgDmjtuO43zK
// studynook


const uri = "mongodb+srv://studynook:tE62LgDmjtuO43zK@cluster0.3rt6ag9.mongodb.net/?appName=Cluster0";

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


