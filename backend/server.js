const { app, init_db, close_db } = require('./app');
const host = '127.0.0.1';
const port = 3000;

init_db('gw.db', 'prod.sql');

app.listen(port, host, () => {
    console.log(`Listening at http://${host}:${port}`);
});

app.on('close', () => {
    close_db();
    console.log('Stopped database connection.');
});