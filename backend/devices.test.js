const request = require('supertest');
const { app, init_db, close_db } = require('./app');

describe('Test the express server endpoints.', () => {
    beforeAll(async () => {
        await init_db(':memory:', 'test.sql');
    });

    afterAll(async () => {
        await close_db();
    });

    expect.extend({
        toBeRequired(received) {
            if (typeof received === 'string' && received) {
                return {
                    message: () => `expected ${received} not to be String (required)`,
                    pass: true
                };
            } else {
                return {
                    message: () => `expected ${received} to be String (required)`,
                    pass: false
                }
            }
        },
        toBeIncluded(received, list) {
            if (list.includes(received)) {
                return {
                    message: () => `expected ${received} not to be included in ${list}`,
                    pass: true
                };
            } else {
                return {
                    message: () => `expected ${received} to be included in ${list}`,
                    pass: false
                }
            }
        },
        toBeTimestamp(received) {
            if (Date.parse(received)) {
                return {
                    message: () => `expected ${received} not to be timestamp`,
                    pass: true
                };
            } else {
                return {
                    message: () => `expected ${received} to be timestamp`,
                    pass: false
                }
            }
        }
    });

    test('Test Index devices response', async () => {
        // Array of device objects and status code 200 expected.
        let response = await request(app).get('/devices');
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);

        for (const device of response.body) {
            expect(device).toMatchObject({
                uid: expect.any(Number),
                vendor: expect.toBeRequired(),
                created: expect.toBeTimestamp(),
                status: expect.toBeIncluded(['online', 'offline']),
                gateway_uuid: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm)
            });
        }
    });

    test('Test Store devices response', async () => {
        // Right device data. Location header and status code 201 expected.
        let response = await request(app).post('/devices').send({
            vendor: 'THTF',
            status: 'online',
            gateway_uuid: 'de4cb03b-a878-4fbe-858e-94b388d2552c'
        });
        expect(response.headers).toMatchObject({
            location: expect.toBeRequired()
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
            uid: expect.any(Number),
            msg: expect.toBeRequired()
        });

        // Wrong device vendor. Status code 422 expected.
        response = await request(app).post('/devices').send({
            vendor: '',
            gateway_uuid: 'de4cb03b-a878-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong device status. Status code 422 expected.
        response = await request(app).post('/devices').send({
            vendor: 'Haier',
            status: 'oline',
            gateway_uuid: 'de4cb03b-a878-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong gateway UUID. Status code 422 expected.
        response = await request(app).post('/devices').send({
            vendor: 'Haier',
            status: 'online',
            gateway_uuid: 'de4cb03ba878-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Unexistent gateway UUID. Status code 409 expected.
        response = await request(app).post('/devices').send({
            vendor: 'Haier',
            status: 'online',
            gateway_uuid: 'de4cb03b-a877-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(409);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Device limit per gateway exceeded. Status code 409 expected.
        for (let i = 0; i < 9; i++) {
            response = await request(app).post('/devices').send({
                vendor: 'Generic',
                gateway_uuid: 'de4cb03b-a878-4fbe-858e-94b388d2552c'
            });
            expect(response.statusCode).toBe(201);
        }

        response = await request(app).post('/devices').send({
            vendor: 'Generic',
            gateway_uuid: 'de4cb03b-a878-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(409);
    });

    test('Test Show device response', async () => {
        // Right device UID. Status code 200 expected.
        let response = await request(app).get('/devices/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            uid: expect.any(Number),
            vendor: expect.toBeRequired(),
            created: expect.toBeTimestamp(),
            status: expect.toBeIncluded(['online', 'offline']),
            gateway_uuid: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm)
        });

        // Wrong device UID. Status code 400 expected.
        response = await request(app).get('/devices/01');
        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Unexistent device UID. Status code 404 expected.
        response = await request(app).get('/devices/15');
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });
    });

    test('Test Update device response', async () => {
        // Right device data. Status code 200 expected.
        let response = await request(app).put('/devices/1').send({
            vendor: 'EPSON',
            status: 'offline',
            gateway_uuid: '32e07bd4-87aa-437e-b5b5-1cd49c8df30c'
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong device UID. Status code 400 expected.
        response = await request(app).put('/devices/01').send({});
        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Unexistent device UID. Status code 404 expected.
        response = await request(app).put('/devices/15').send({});
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Wrong device vendor. Status code 422 expected.
        response = await request(app).put('/devices/1').send({
            vendor: ''
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong device status. Status code 422 expected.
        response = await request(app).put('/devices/1').send({
            status: 'on'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong gateway UUID. Status code 422 expected.
        response = await request(app).put('/devices/1').send({
            gateway_uuid: 'de4cb03ba878-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Unexistent gateway UUID. Status code 409 expected.
        response = await request(app).put('/devices/1').send({
            gateway_uuid: '32e07bd4-87ab-437e-b5b5-1cd49c8df30c'
        });
        expect(response.statusCode).toBe(409);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Device limit per gateway exceeded. Status code 409 expected.
        response = await request(app).put('/devices/1').send({
            gateway_uuid: 'de4cb03b-a878-4fbe-858e-94b388d2552c'
        });
        expect(response.statusCode).toBe(409);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });
    });

    test('Test Delete device response', async () => {
        // Right device UID. Status code 200 expected.
        let response = await request(app).delete('/devices/3');
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Wrong device UID. Status code 400 expected.
        response = await request(app).delete('/devices/03');
        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Unexistent gateway UUID. Status code 404 expected.
        response = await request(app).get('/devices/3');
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });
    });
});