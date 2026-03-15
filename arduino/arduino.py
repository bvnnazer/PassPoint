import serial
import requests

arduino = serial.Serial("COM5", baudrate=9600, timeout=1)
backend_url = "http://127.0.0.1:5000/scan_rfid"

try:
    while True:
            if arduino.in_waiting > 0:
                data = arduino.readline().decode("utf-8").strip()
                print(data)
                response = requests.post(backend_url, json=data)
                print(f"Response {response}")

except KeyboardInterrupt:
    print(f"Process interrupted by user")

finally:
    arduino.close()
    print("Serial Closed")