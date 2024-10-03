// server.js

const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const mqtt = require('mqtt');

const app = express();
const port = 5001;

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Store data
let intersections = {};

// Start the HTTP server
const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// WebSocket Server setup
const wss = new WebSocket.Server({ server });

// MQTT Client Setup

// Connection options for HiveMQ Cloud
const options = {
    host: 'd84c2c14a2bf4a4787c6216af03c7126.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts', // Secure MQTT over TLS
    username: 'aamyaaaa', // Replace with your HiveMQ Cloud username
    password: 'HelloWorld123', // Replace with your HiveMQ Cloud password
    rejectUnauthorized: true, // Ensure the server certificate is verified
};

// Connect to HiveMQ Cloud broker
const mqttClient = mqtt.connect(options);

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

mqttClient.on('error', (err) => {
    console.error('MQTT Client Error:', err);
});

mqttClient.on('message', (topic, message) => {
    // Parse the incoming message
    try {
        const sensorData = JSON.parse(message.toString());
        const intersectionId = sensorData.intersection_id;

        // Update sensor data
        intersections[intersectionId] = intersections[intersectionId] || {};
        intersections[intersectionId].sensorData = sensorData;

        // Process sensor data
        processSensorData(intersectionId);
    } catch (error) {
        console.error('Error parsing MQTT message:', error);
    }
});

function processSensorData(intersectionId) {
    const data = intersections[intersectionId].sensorData;

    // Extract counts
    const nsCars = data.north_south.cars;
    const nsPedestrians = data.north_south.pedestrians;
    const ewCars = data.east_west.cars;
    const ewPedestrians = data.east_west.pedestrians;

    const nsTotal = nsCars + nsPedestrians;
    const ewTotal = ewCars + ewPedestrians;

    let trafficLightState = {
        'north_south': 'RED',
        'east_west': 'RED',
        'pedestrians_ns': 'RED',
        'pedestrians_ew': 'RED',
        'duration': 15 // Default duration for cars
    };

    if (nsTotal > ewTotal) {
        // North-South direction has more traffic
        trafficLightState.north_south = 'GREEN';
        trafficLightState.east_west = 'RED';

        if (nsPedestrians > 0) {
            // Pedestrians are present; extend duration
            trafficLightState.pedestrians_ns = 'GREEN';
            trafficLightState.duration = 25; // Longer duration for pedestrians
        } else {
            trafficLightState.pedestrians_ns = 'RED';
        }
        trafficLightState.pedestrians_ew = 'RED';
    } else {
        // East-West direction has more traffic
        trafficLightState.north_south = 'RED';
        trafficLightState.east_west = 'GREEN';

        if (ewPedestrians > 0) {
            // Pedestrians are present; extend duration
            trafficLightState.pedestrians_ew = 'GREEN';
            trafficLightState.duration = 25; // Longer duration for pedestrians
        } else {
            trafficLightState.pedestrians_ew = 'RED';
        }
        trafficLightState.pedestrians_ns = 'RED';
    }

    intersections[intersectionId].trafficLightState = trafficLightState;
    intersections[intersectionId].changeTime = Date.now(); // Record change time

    // Broadcast the updated state
    broadcast(intersectionId);
}


// Broadcast function
function broadcast(intersectionId) {
    const data = intersections[intersectionId];
    const message = {
        intersection_id: intersectionId,
        trafficLightState: data.trafficLightState,
        sensorData: data.sensorData,
        changeTime: data.changeTime // Include changeTime for timers
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}
