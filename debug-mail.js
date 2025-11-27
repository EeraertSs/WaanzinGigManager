const imaps = require('imap-simple');

const config = {
    imap: {
        user: 'info@waanzin.band',
        password: 'BS*e%BQzYrgQyA5fw%RS782QM$KY',
        host: 'mail.hostedservice.be',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
    }
};

console.log('Connecting to IMAP...');

imaps.connect(config).then(function (connection) {
    console.log('CONNECTION SUCCESSFUL!');
    return connection.openBox('INBOX').then(function () {
        console.log('INBOX OPENED!');

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false,
            struct: true
        };

        return connection.search(searchCriteria, fetchOptions).then(function (messages) {
            console.log(`Found ${messages.length} messages.`);
            connection.end();
        });
    });
}).catch(function (err) {
    console.error('CONNECTION FAILED:', err);
});
