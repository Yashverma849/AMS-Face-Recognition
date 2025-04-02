# Attendance Management System with Face Recognition

This is a Next.js web application with a Python backend for facial recognition-based attendance management.

## Features

- Student registration with facial data
- Automated attendance via face recognition
- Attendance records and statistics
- User-friendly web interface

## Project Structure

The project consists of two main parts:

1. **Next.js Frontend** - Web interface built with Next.js
2. **Python Backend** - Flask server for face recognition processing

## Requirements

### Frontend
- Node.js 18+ and npm/pnpm
- Next.js 13+

### Backend
- Python 3.8+
- OpenCV
- dlib
- face_recognition library
- Flask

## Setup Instructions

### Setting up the Frontend

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Copy the `.env.local.example` file to `.env.local` if it doesn't exist already:
```bash
cp .env.local.example .env.local
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting up the Python Backend

1. Navigate to the python-server directory:
```bash
cd python-server
```

2. Run the setup script to create necessary directories and install dependencies:
```bash
# On Windows
python setup.py

# On Linux/macOS
python3 setup.py
```

3. Start the Flask server:
```bash
# On Windows
python app.py

# On Linux/macOS
python3 app.py
```

The Python server will run on port 5000.

## Using the Application

### 1. Register Students
- Go to the "Register Student" page
- Fill in the student details
- Capture the student's facial data using the webcam
- Submit the form to register the student

### 2. Take Attendance
- Go to the "Take Attendance" page
- Fill in the session details
- Click "Start Scanning" and position the camera to capture all students
- The system will recognize faces and mark attendance
- Review and save the attendance results

### 3. View Attendance Records
- Go to the "View Attendance" page
- Browse attendance records by session or by student
- Filter and export attendance data as needed

## Integration Overview

### How it works:

1. The Next.js frontend provides the user interface for registration, attendance, and viewing records.
2. When a student is registered, their facial data is sent to the Python backend for processing.
3. The Python backend uses the `face_recognition` library to extract facial features and stores them.
4. For attendance, camera feed is sent to the Python backend, where faces are recognized against stored encodings.
5. Recognition results are sent back to the frontend and displayed to the user.

## Common Issues & Troubleshooting

### dlib Installation Issues
- On Windows, installing dlib can be tricky. Follow these steps:
  1. Install Visual Studio with C++ build tools
  2. Use a pre-built wheel: `pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp310-cp310-win_amd64.whl` (adjust for your Python version)

### Camera Access Issues
- Make sure your browser has permission to access the camera
- Try using Chrome or Edge if you're having issues with other browsers

### Face Recognition Accuracy
- Ensure good lighting when capturing facial data
- Position faces directly towards the camera for best results
- If recognition is poor, try adjusting the confidence threshold in `.env.local`

## Configuration

You can modify the following settings:

- In `.env.local`: Configure API endpoints and face recognition parameters
- In `python-server/app.py`: Adjust face recognition parameters

## Based on

This project is a web adaptation of [Attendance Management System With Face Recognition](https://github.com/Yashverma849/Attendance-Management-System-With-Face-Recognition.git) by Yash Verma.

## License

MIT 