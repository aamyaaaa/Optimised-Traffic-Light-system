import time
import random
import json
import paho.mqtt.client as mqtt

def simulate_sensor_data():
    intersections = ['A', 'B', 'C']  # Add more intersections as needed

    # MQTT Client Setup
    mqtt_client = mqtt.Client()

    # Set username and password for HiveMQ Cloud authentication
    mqtt_client.username_pw_set('aamyaaaa', 'HelloWorld123')  # Replace with your credentials

    # Enable TLS for secure connection
    mqtt_client.tls_set()  # Use default SSL/TLS settings

    # Connect to HiveMQ Cloud broker
    mqtt_client.connect('d84c2c14a2bf4a4787c6216af03c7126.s1.eu.hivemq.cloud', 8883)

    # Start the network loop
    mqtt_client.loop_start()

    while True:
        for intersection in intersections:
            sensor_data = {
                'intersection_id': intersection,
                'north_south': {
                    'cars': random.randint(0, 10),
                    'pedestrians': random.randint(0, 5)
                },
                'east_west': {
                    'cars': random.randint(0, 10),
                    'pedestrians': random.randint(0, 5)
                }
            }

            # Publish the data to MQTT topic
            topic = f'sensors/{intersection}'
            mqtt_client.publish(topic, json.dumps(sensor_data))
            print(f"Published data to topic '{topic}': {sensor_data}")

        time.sleep(1)  # Send data every second

if __name__ == '__main__':
    simulate_sensor_data()
