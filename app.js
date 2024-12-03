
const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const app = express();

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'lojamesatua';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'webhook.log' })
    ]
});

app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        logger.info('Webhook validated successfully!');
        res.status(200).send(challenge);
    } else {
        logger.error('Webhook validation failed. Check the token or URL.');
        res.status(403).send('Webhook validation failed');
    }
});

app.post('/webhook', (req, res) => {
    try {
        logger.info('Event received:', req.body);

        if (req.body.object === 'whatsapp_business_account') {
            req.body.entry.forEach((entry) => {
                entry.changes.forEach((change) => {
                    if (change.field === 'messages') {
                        const messageData = change.value.messages[0];
                        const from = messageData.from;
                        const text = messageData.text.body;

                        logger.info(`Message received from ${from}: "${text}"`);
                    }
                });
            });
        }

        res.sendStatus(200);
    } catch (error) {
        logger.error('Error processing webhook event:', error);
        res.sendStatus(500);
    }
});

app.use((req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.url}`);
    res.status(404).send('Route not found.');
});

app.listen(PORT, () => {
    logger.info(`Webhook server running on port ${PORT}`);
});
