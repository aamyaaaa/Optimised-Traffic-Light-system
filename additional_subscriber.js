// additional_subscriber.js

const mqtt = require('mqtt');

const mqttOptions = {
    host: 'd84c2c14a2bf4a4787c6216af03c7126.s1.eu.hivemq.cloud', 
    port: 8883,
    protocol: 'mqtts',
    username: 'aamyaaaa',
    password: 'HelloWorld123',
    rejectUnauthorized: true,
};


const mqttClient = mqtt.connect(mqttOptions);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('sensors/#', (err) => {
        if (err) {
            console.error('Failed to subscribe to MQTT topics:', err);
        } else {
            console.log('Subscribed to MQTT topics');
        }
    });
});

mqttClient.on('message', (topic, message) => {
    const sensorData = JSON.parse(message.toString());
    console.log(`Received data on topic '${topic}':`, sensorData);
    // Process or store the sensor data as needed
});
