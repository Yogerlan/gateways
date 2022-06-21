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

    test('Test Index gateways response', async () => {
        // Array of gateway objects and status code 200 expected.
        let response = await request(app).get('/gateways');
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);

        for (const gateway of response.body) {
            expect(gateway).toMatchObject({
                uuid: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm),
                name: expect.toBeRequired(),
                ipv4: expect.stringMatching(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm),
                devices: expect.any(Array)
            });

            for (const device of gateway.devices) {
                expect(device).toMatchObject({
                    uid: expect.any(Number),
                    vendor: expect.toBeRequired(),
                    created: expect.toBeTimestamp(),
                    status: expect.toBeIncluded(['online', 'offline'])
                });
            }
        }
    });

    test('Test Store gateway response', async () => {
        // Right gateway data. Location header and status code 201 expected.
        let response = await request(app).post('/gateways').send({
            name: 'server1',
            ipv4: '10.0.0.1'
        });
        expect(response.headers).toMatchObject({
            location: expect.toBeRequired()
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
            uuid: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm),
            msg: expect.toBeRequired()
        });

        // Wrong gateway name. Status code 422 expected.
        response = await request(app).post('/gateways').send({
            name: '',
            ipv4: '10.0.0.2'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong gateway IPv4 address. Status code 422 expected.
        response = await request(app).post('/gateways').send({
            name: 'server2',
            ipv4: '10.0.0.'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });
    });

    test('Test Show gateway response', async () => {
        // Right gateway UUID. Status code 200 expected.
        let response = await request(app).get('/gateways/de4cb03b-a878-4fbe-858e-94b388d2552c');
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            uuid: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm),
            name: expect.toBeRequired(),
            ipv4: expect.stringMatching(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm)
        });
        expect(response.body.name).toBeTruthy();

        // Wrong gateway UUID. Status code 400 expected.
        response = await request(app).get('/gateways/de4cb03ba8784fbe858e94b388d2552c');
        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Unexistent gateway UUID. Status code 404 expected.
        response = await request(app).get('/gateways/00000000-0000-0000-0000-000000000000');
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });
    });

    test('Test Update gateway response', async () => {
        // Right gateway data. Status code 200 expected.
        let response = await request(app).put('/gateways/a401e284-632e-4dab-b577-0846d3c72a16').send({
            name: 'firewall',
            ipv4: '192.168.0.1'
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong gateway UUID. Status code 400 expected.
        response = await request(app).put('/gateways/a401e284-632e4dab-b577-0846d3c72a16').send({});
        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Unexistent gateway UUID. Status code 404 expected.
        response = await request(app).put('/gateways/a401e284-632e-4dac-b577-0846d3c72a16').send({});
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Wrong gateway name. Status code 422 expected.
        response = await request(app).put('/gateways/a401e284-632e-4dab-b577-0846d3c72a16').send({
            name: '',
            ipv4: '10.0.0.1'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });

        // Wrong gateway IPv4 address. Status code 422 expected.
        response = await request(app).put('/gateways/a401e284-632e-4dab-b577-0846d3c72a16').send({
            ipv4: '192.1680.1'
        });
        expect(response.statusCode).toBe(422);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired()
        });
    });

    test('Test Delete gateway response', async () => {
        // Right gateway UUID. Status code 200 expected.
        let response = await request(app).delete('/gateways/32e07bd4-87aa-437e-b5b5-1cd49c8df30c');
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Wrong gateway UUID. Status code 400 expected.
        response = await request(app).delete('/gateways/32e07bd4-87aa-437eb5b5-1cd49c8df30c');
        expect(response.statusCode).toBe(400);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });

        // Unexistent gateway UUID. Status code 404 expected.
        response = await request(app).get('/gateways/32e07bd4-87aa-437e-b5b5-1cd49c8df30c');
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
            msg: expect.toBeRequired(),
        });
    });
});