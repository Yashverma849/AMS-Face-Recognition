import cv2
import numpy as np

def detect_faces(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    # Use more sensitive parameters (smaller scale factor and minimum neighbors)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))
    return faces

def face_encodings(image, locations=None):
    # This is a dummy function that returns random encodings
    # Replace with actual face recognition in production
    if locations is None:
        locations = detect_faces(image)
    return [np.random.rand(128) for _ in locations]

def face_locations(image):
    faces = detect_faces(image)
    # Convert from (x, y, w, h) to (top, right, bottom, left) format
    return [(y, x+w, y+h, x) for (x, y, w, h) in faces]

def compare_faces(known_encodings, face_encoding, tolerance=0.6):
    # Dummy implementation
    return [np.random.choice([True, False]) for _ in known_encodings]

def face_distance(known_encodings, face_encoding):
    # Dummy implementation
    return [np.random.rand() for _ in known_encodings] 