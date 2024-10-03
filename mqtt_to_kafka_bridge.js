// mqtt_to_kafka_bridge.js

const mqtt = require('mqtt');
const kafka = require('kafka-node');

const mqttOptions = {
    host: 'd84c2c14a2bf4a4787c6216af03c7126.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: 'aamyaaaa', 
    password: 'HelloWorld123', 
    rejectUnauthorized: true,
};

const kafkaBroker = 'localhost:9092'; 
const kafkaTopic = 'sensor_data';

const mqttClient = mqtt.connect(mqttOptions);

const kafkaClient = new kafka.KafkaClient({ kafkaHost: kafkaBroker });
const producer = new kafka.Producer(kafkaClient);

producer.on('ready', () => {
    console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
    console.error('Error with Kafka Producer:', err);
});

mqttClient.on('connect', () => {
    console.log('Connected to HiveMQ Cloud broker');
    mqttClient.subscribe('sensors/#', (err) => {
        if (err) {
            console.error('Failed to subscribe to MQTT topics:', err);
        } else {
            console.log('Subscribed to MQTT topics');
        }
    });
});

mqttClient.on('message', (topic, message) => {
    const payloads = [
        {
            topic: kafkaTopic,
            messages: message.toString(),
        },
    ];
    producer.send(payloads, (err, data) => {
        if (err) {
            console.error('Error sending data to Kafka:', err);
        } else {
            console.log(`Sent data to Kafka topic '${kafkaTopic}':`, data);
        }
    });
});
