import { RequestResponseData } from './../models/requestResponseData';
import { NextFunction, Request, Response } from 'express';

const { Client } = require('@elastic/elasticsearch');

const log = (req: Request, res: Response, next: NextFunction) => {

    return res.status(200).json({
        message: 'pong'
    });
};

async function run(data: string) {
    const client = new Client({
        node: 'https://localhost:9200',
        auth: {
            username: 'elastic',
            password: 'elastic2021'
        },
        ssl: {
            rejectUnauthorized: false
        }
    });
    await client.indices.create({
        index: 'request-response-data',
        body: {
            mappings: {
                properties: {
                    id: { type: 'text' },
                    dateTime: { type: 'date' },
                    data: { type: 'text' }
                }
            }
        }
    }, { ignore: [400] });
    const dataSet: RequestResponseData[] = [{
        id: 'testdata1',
        dateTime: new Date(),
        data: data
    }];
    const body = dataSet.flatMap(doc => [{ index: { _index: 'request-response-data' } }, doc]);

    const { body: bulkResponse } = await client.bulk({ refresh: true, body });
}

export default { log };