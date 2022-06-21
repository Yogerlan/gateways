CREATE TABLE gateways (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ipv4 TEXT NOT NULL);

CREATE TABLE devices (
    uid INTEGER PRIMARY KEY,
    vendor TEXT NOT NULL,
    created TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'offline',
    gateway_uuid TEXT REFERENCES gateways(uuid) ON DELETE CASCADE ON UPDATE CASCADE);

INSERT INTO gateways (uuid, name, ipv4)
    VALUES ('a401e284-632e-4dab-b577-0846d3c72a16', 'server1', '10.0.0.1');

INSERT INTO gateways (uuid, name, ipv4)
    VALUES ('de4cb03b-a878-4fbe-858e-94b388d2552c', 'server2', '10.0.0.2');

INSERT INTO gateways (uuid, name, ipv4)
    VALUES ('32e07bd4-87aa-437e-b5b5-1cd49c8df30c', 'server3', '10.0.0.3');

INSERT INTO devices (vendor, status, gateway_uuid)
    VALUES ('ASUS', 'online', 'a401e284-632e-4dab-b577-0846d3c72a16');

INSERT INTO devices (vendor, gateway_uuid)
    VALUES ('GIGABYTE', 'a401e284-632e-4dab-b577-0846d3c72a16');