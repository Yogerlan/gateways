const express = require('express');
const cors = require('cors');
const app = express();

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
let db = null;

const crypto = require('crypto');
const path = require('path');

/**
 * Init database
 */
const init_db = async (db_filename, queries_filename) => {
    db = new sqlite3.Database(db_filename);
    const queries = fs.readFileSync(queries_filename, 'utf-8');

    for (const _query of queries.split(';')) {
        const query = _query.trim() + ';';

        if (query.length > 1) {
            await new Promise((resolve) => {
                db.run(query, (err) => {
                    if (err) {
                        console.log(err);
                    }

                    resolve();
                });
            });
        }
    }
}

/**
 * Close database
 */
const close_db = async () => {
    await new Promise((resolve) => {
        db.close((err) => {
            if (err) {
                console.log(err);
            }

            resolve();
        });
    });
}

/**
 * Applying STATIC middleware
 */
app.use(express.static(path.join(__dirname, '../frontend/dist/frontend')));

/**
 * Applying JSON middleware
 */
app.use(express.json());

/**
 * Applying CORS middleware
 */
app.use(cors());

/**
 * function: Index
 * 
 * path: GET /gateways
 * 
 * description: List gateways.
 */
app.get('/gateways', async (_req, res) => {
    const gateways = await new Promise((resolve) => {
        db.all('SELECT * FROM gateways;', (err, rows) => {
            if (err) {
                console.log(err);
            }

            resolve(rows);
        });
    });

    for (const gateway of gateways) {
        gateway.devices = [];
        const devices = await new Promise((resolve) => {
            db.all(
                'SELECT * FROM devices WHERE gateway_uuid = $gateway_uuid;',
                { $gateway_uuid: gateway.uuid }, (err, rows) => {
                    if (err) {
                        console.log(err);
                    }

                    resolve(rows);
                });
        });

        for (const device of devices) {
            gateway.devices.push({
                uid: device.uid,
                vendor: device.vendor,
                created: device.created,
                status: device.status
            });
        }
    }

    res.status(200).json(gateways);
});

/**
 * function: Store
 * 
 * path: POST /gateways
 * 
 * description: Store a gateway.
 */
app.post('/gateways', async (req, res) => {
    // Validate name
    const name = req.body.name;

    if (!name) {
        res.status(422).json({
            msg: 'Invalid gateway name (required).'
        });

        return;
    }

    // Validate IPv4
    const ipv4 = req.body.ipv4;

    if (!ipv4 || !/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm.test(ipv4)) {
        res.status(422).json({
            msg: 'Invalid gateway IPv4 address (required).'
        });

        return;
    }

    // Generate UUID
    let uuid = '';

    while (!uuid) {
        uuid = crypto.randomUUID();
        let gateway = await new Promise((resolve) => {
            db.get(
                'SELECT uuid FROM gateways WHERE uuid = $uuid LIMIT 1;',
                { $uuid: uuid }, (err, row) => {
                    if (err) {
                        console.log(err);
                    }

                    resolve(row);
                });
        });

        if (gateway) {
            uuid = '';
        }
    }

    await new Promise((resolve) => {
        db.run(
            'INSERT INTO gateways (uuid, name, ipv4) VALUES ($uuid, $name, $ipv4);',
            { $uuid: uuid, $name: name, $ipv4: ipv4 }, (err) => {
                if (err) {
                    console.log(err);
                }

                resolve();
            });
    });

    // Retrieve the new record location
    let root_url = `${req.protocol}://${req.hostname}`;
    const port = process.env.port;

    if (port && ((req.protocol === 'http' && port !== 80) || (req.protocol === 'https' && port !== 443))) {
        root_url += `:${port}`;
    }

    res.setHeader('Location', `${root_url}${req.originalUrl}/${uuid}`);
    res.status(201).json({
        uuid,
        msg: 'Gateway added successfully.'
    });
});

/**
 * function: Show
 * 
 * path: GET /gateways/uuid
 * 
 * description: Show a gateway.
 */
app.get('/gateways/:uuid', async (req, res) => {
    // Validate UUID param
    const uuid = req.params.uuid;

    if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm.test(uuid)) {
        res.status(400).json({
            msg: 'Incorrect or missing gateway UUID.'
        });

        return;
    }

    const gateway = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM gateways WHERE uuid = $uuid LIMIT 1;',
            { $uuid: uuid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!gateway) {
        res.status(404).json({
            msg: 'Gateway not found.'
        });

        return;
    }

    gateway.devices = [];
    const devices = await new Promise((resolve) => {
        db.all(
            'SELECT * FROM devices WHERE gateway_uuid = $gateway_uuid;',
            { $gateway_uuid: gateway.uuid }, (err, rows) => {
                if (err) {
                    console.log(err);
                }

                resolve(rows);
            });
    });

    for (const device of devices) {
        gateway.devices.push({
            uid: device.uid,
            vendor: device.vendor,
            created: device.created,
            status: device.status
        });
    }

    res.status(200).json(gateway);
});

/**
 * function: Update
 * 
 * path: PUT /gateways/uuid (Omitting PATCH to simplify)
 * 
 * description: Update a gateway.
 */
app.put('/gateways/:uuid', async (req, res) => {
    // Validate UUID param
    const uuid = req.params.uuid;

    if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm.test(uuid)) {
        res.status(400).json({
            msg: 'Incorrect or missing gateway UUID.'
        });

        return;
    }

    const gateway = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM gateways WHERE uuid = $uuid LIMIT 1;',
            { $uuid: uuid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!gateway) {
        res.status(404).json({
            msg: 'Gateway not found.'
        });

        return;
    }

    // Validate name
    let name = gateway.name;

    if ('name' in req.body) {
        name = req.body.name;

        if (!name) {
            res.status(422).json({
                msg: 'Invalid gateway name (required).'
            });
            return;
        }
    }

    // Validate IPv4
    let ipv4 = gateway.ipv4;
    if ('ipv4' in req.body) {
        ipv4 = req.body.ipv4;

        if (!/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm.test(ipv4)) {
            res.status(422).json({
                msg: 'Invalid gateway IPv4 address (required).'
            });
            return;
        }
    }

    await new Promise((resolve) => {
        db.run(
            'UPDATE gateways SET name = $name, ipv4 = $ipv4 WHERE uuid = $uuid;',
            { $uuid: uuid, $name: name, $ipv4: ipv4 }, (err) => {
                if (err) {
                    console.log(err);
                }

                resolve();
            });
    });

    res.status(200).json({
        msg: 'Gateway updated successfully.'
    });
});

/**
 * function: Delete
 * 
 * path: DELETE /gateways/uuid
 * 
 * description: Delete a gateway.
 */
app.delete('/gateways/:uuid', async (req, res) => {
    // Validate UUID param
    const uuid = req.params.uuid;

    if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm.test(uuid)) {
        res.status(400).json({
            msg: 'Incorrect or missing gateway UUID.'
        });

        return;
    }

    const gateway = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM gateways WHERE uuid = $uuid LIMIT 1;',
            { $uuid: uuid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!gateway) {
        res.status(404).json({
            msg: 'Gateway not found.'
        });

        return;
    }

    await new Promise((resolve) => {
        db.run(
            'DELETE FROM gateways WHERE uuid = $uuid;',
            { $uuid: uuid }, (err) => {
                if (err) {
                    console.log(err);
                }

                resolve();
            });
    });

    res.status(200).json({
        msg: 'Gateway deleted successfully.'
    });
});

/**
 * function: Index
 * 
 * path: GET /devices
 * 
 * description: List devices.
 */
app.get('/devices', async (_req, res) => {
    const devices = await new Promise((resolve) => {
        db.all('SELECT * FROM devices;', (err, rows) => {
            if (err) {
                console.log(err);
            }

            resolve(rows);
        });
    });

    res.status(200).json(devices);
});

/**
 * function: Store
 * 
 * path: POST /devices
 * 
 * description: Store a device.
 */
app.post('/devices', async (req, res) => {
    // Validate gateway UUID
    const gateway_uuid = req.body.gateway_uuid;

    if (!gateway_uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm.test(gateway_uuid)) {
        res.status(422).json({
            msg: 'Invalid gateway UUID (required).'
        });

        return;
    }

    const gateway = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM gateways WHERE uuid = $uuid LIMIT 1;',
            { $uuid: gateway_uuid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!gateway) {
        res.status(409).json({
            msg: 'Gateway not found.'
        });

        return;
    }

    const devices_count = await new Promise((resolve) => {
        db.get(
            'SELECT count(*) AS count FROM devices WHERE gateway_uuid = $gateway_uuid;',
            { $gateway_uuid: gateway_uuid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (devices_count.count === 10) {
        res.status(409).json({
            msg: 'Device limit per gateway exceeded.'
        })

        return;
    }

    // Validate vendor
    const vendor = req.body.vendor;

    if (!vendor) {
        res.status(422).json({
            msg: 'Invalid device vendor (required).'
        });

        return;
    }

    // Validate status
    let status = 'offline';

    if ('status' in req.body) {
        status = req.body.status;

        if (!['online', 'offline'].includes(status)) {
            res.status(422).json({
                msg: 'Invalid device status (online|offline).'
            });

            return;
        }
    }

    const lastID = await new Promise((resolve) => {
        db.run(
            'INSERT INTO devices (vendor, status, gateway_uuid) VALUES ($vendor, $status, $gateway_uuid);',
            { $vendor: vendor, $status: status, $gateway_uuid: gateway_uuid }, function (err) {
                if (err) {
                    console.log(err);
                }

                resolve(this.lastID);
            });
    });

    // Retrieve the new record location
    let root_url = `${req.protocol}://${req.hostname}`;
    const port = process.env.port;

    if (port && ((req.protocol === 'http' && port !== 80) || (req.protocol === 'https' && port !== 443))) {
        root_url += `:${port}`;
    }

    res.setHeader('Location', `${root_url}${req.originalUrl}/${lastID}`);
    res.status(201).json({
        uid: lastID,
        msg: 'Device added successfully.'
    });
});

/**
 * function: Show
 * 
 * path: GET /devices/uid
 * 
 * description: Show a device.
 */
app.get('/devices/:uid', async (req, res) => {
    // Validate UUID param
    const uid = req.params.uid;

    if (!uid || !/^[1-9]\d*$/gm.test(uid)) {
        res.status(400).json({
            msg: 'Incorrect or missing device UID.'
        });

        return;
    }

    const device = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM devices WHERE uid = $uid LIMIT 1;',
            { $uid: uid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!device) {
        res.status(404).json({
            msg: 'Device not found.'
        });

        return;
    }

    res.status(200).json(device);
});

/**
 * function: Update
 * 
 * path: PUT /devices/uid (Omitting PATCH to simplify)
 * 
 * description: Update a device.
 */
app.put('/devices/:uid', async (req, res) => {
    // Validate UID param
    const uid = req.params.uid;

    if (!uid || !/^[1-9]\d*$/gm.test(uid)) {
        res.status(400).json({
            msg: 'Incorrect or missing device UID.'
        });

        return;
    }

    const device = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM devices WHERE uid = $uid LIMIT 1;',
            { $uid: uid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!device) {
        res.status(404).json({
            msg: 'Device not found.'
        });

        return;
    }

    // Validate vendor
    let vendor = device.vendor;

    if ('vendor' in req.body) {
        vendor = req.body.vendor;

        if (!vendor) {
            res.status(422).json({
                msg: 'Invalid device vendor (required).'
            });

            return;
        }
    }

    // Validate status
    let status = device.status;

    if ('status' in req.body) {
        status = req.body.status;

        if (!['online', 'offline'].includes(status)) {
            res.status(422).json({
                msg: 'Invalid device status (online|offline).'
            });

            return;
        }
    }

    // Validate gateway UUID
    let gateway_uuid = device.gateway_uuid;

    if ('gateway_uuid' in req.body) {
        gateway_uuid = req.body.gateway_uuid;

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gm.test(gateway_uuid)) {
            res.status(422).json({
                msg: 'Invalid gateway UUID (required).'
            });

            return;
        }

        const gateway = await new Promise((resolve) => {
            db.get(
                'SELECT * FROM gateways WHERE uuid = $uuid LIMIT 1;',
                { $uuid: gateway_uuid }, (err, row) => {
                    if (err) {
                        console.log(err);
                    }

                    resolve(row);
                });
        });

        if (!gateway) {
            res.status(409).json({
                msg: 'Gateway not found.'
            });

            return;
        }

        const devices_count = await new Promise((resolve) => {
            db.get(
                'SELECT count(*) AS count FROM devices WHERE gateway_uuid = $gateway_uuid;',
                { $gateway_uuid: gateway_uuid }, (err, row) => {
                    if (err) {
                        console.log(err);
                    }

                    resolve(row);
                });
        });

        if (devices_count.count === 10) {
            res.status(409).json({
                msg: 'Device limit per gateway exceeded.'
            })

            return;
        }
    }

    await new Promise((resolve) => {
        db.run(
            'UPDATE devices SET vendor = $vendor, status = $status, gateway_uuid = $gateway_uuid WHERE uid = $uid;',
            { $vendor: vendor, $status: status, $gateway_uuid: gateway_uuid, $uid: uid }, (err) => {
                if (err) {
                    console.log(err);
                }

                resolve();
            });
    });

    res.status(200).json({
        msg: 'Device updated successfully.'
    });
});

/**
 * function: Delete
 * 
 * path: DELETE /devices/uid
 * 
 * description: Delete a device.
 */
app.delete('/devices/:uid', async (req, res) => {
    // Validate UID param
    const uid = req.params.uid;

    if (!uid || !/^[1-9]\d*$/gm.test(uid)) {
        res.status(400).json({
            msg: 'Incorrect or missing device UID.'
        });

        return;
    }

    const device = await new Promise((resolve) => {
        db.get(
            'SELECT * FROM devices WHERE uid = $uid LIMIT 1;',
            { $uid: uid }, (err, row) => {
                if (err) {
                    console.log(err);
                }

                resolve(row);
            });
    });

    if (!device) {
        res.status(404).json({
            msg: 'Device not found.'
        });

        return;
    }

    await new Promise((resolve) => {
        db.run(
            'DELETE FROM devices WHERE uid = $uid;',
            { $uid: uid }, (err) => {
                if (err) {
                    console.log(err);
                }

                resolve();
            });
    });

    res.status(200).json({
        msg: 'Device deleted successfully.'
    });
});

module.exports = { app, init_db, close_db };