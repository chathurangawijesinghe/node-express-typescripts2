import fs from 'fs';
import express, { Application, Request, Response, NextFunction } from 'express';

const { Client } = require('@elastic/elasticsearch');

const app: Application = express();

// Express configuration
app.set("port", process.env.PORT || 3000);

app.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await run();

    res.send('Hello');
});

async function run() {
    const client = new Client({
        node: 'https://localhost:9200',
        auth: {
            username: 'elastic',
            password: 'elastic2021'
        },
        ssl: {
          //ca: fs.readFileSync('./cacert.pem'),
          rejectUnauthorized: false
        }
    });
    await client.indices.create({
        index: 'tweets',
        body: {
            mappings: {
                properties: {
                    id: { type: 'integer' },
                    text: { type: 'text' },
                    user: { type: 'keyword' },
                    time: { type: 'date' }
                }
            }
        }
    }, { ignore: [400] })

    const body = dataset.flatMap(doc => [{ index: { _index: 'tweets' } }, doc])

    const { body: bulkResponse } = await client.bulk({ refresh: true, body })

    if (bulkResponse.errors) {
        const erroredDocuments: any = [];
        // The items array has the same order of the dataset we just indexed.
        // The presence of the `error` key indicates that the operation
        // that we did for the document has failed.
        bulkResponse.items.forEach((action: any, i: number) => {
            const operation = Object.keys(action)[0]
            if (action[operation].error) {
                erroredDocuments.push({
                    // If the status is 429 it means that you can retry the document,
                    // otherwise it's very likely a mapping error, and you should
                    // fix the document before to try it again.
                    status: action[operation].status,
                    error: action[operation].error,
                    operation: body[i * 2],
                    document: body[i * 2 + 1]
                })
            }
        })
        console.log(erroredDocuments)
    }

    const { body: count } = await client.count({ index: 'tweets' })
    console.log(count)
}

const dataset = [{
    id: 1,
    text: 'If I fall, don\'t bring me back.',
    user: 'jon',
    date: new Date()
}, {
    id: 2,
    text: 'Winter is coming',
    user: 'ned',
    date: new Date()
}, {
    id: 3,
    text: 'A Lannister always pays his debts.',
    user: 'tyrion',
    date: new Date()
}, {
    id: 4,
    text: 'I am the blood of the dragon.',
    user: 'daenerys',
    date: new Date()
}, {
    id: 5, // change this value to a string to see the bulk response with errors
    text: 'A girl is Arya Stark of Winterfell. And I\'m going home.',
    user: 'arya',
    date: new Date()
}];

app.listen(5000, () => console.log('Server running...'));

export default app;