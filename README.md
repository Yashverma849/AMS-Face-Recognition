# BPIT Attendance System

A face recognition-based attendance system for BPIT. This application allows instructors to register students and take attendance using facial recognition technology.

## Features

- Web-based interface for easy access
- Face recognition for student identification
- Registration of new students with facial data
- Taking attendance by recognizing faces
- Viewing attendance records

## System Architecture

The system consists of two main components:

1. **Frontend**: Next.js web application for user interface
2. **Backend**: Python-based face recognition API running on Render.com

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Python 3.8+ (for backend API)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with the required environment variables
4. Start the development server: `npm run dev`

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: URL for Supabase instance
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key for Supabase
- `NEXT_PUBLIC_FACE_API_URL`: URL for the face recognition API

## Deployment

The frontend is deployed on Vercel and the face recognition API is deployed on Render.com.

Last updated: April 3, 2025

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Python, Flask
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Face Recognition**: OpenCV (Python)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (recommended for best compatibility)
- Supabase account

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL in `database_schema.sql` in the Supabase SQL editor
3. Create two storage buckets: `student-images` and `attendance-images`
4. Set up authentication providers (Email, Google OAuth)
5. Get your Supabase URL and keys from the Settings → API section

### Environment Setup

1. **Frontend**: Copy `.env.example` to `.env.local` and fill in your Supabase details:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Backend**: Copy `python-server/.env.example` to `python-server/.env` and fill in:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Installation

1. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

2. **Backend**:
   ```bash
   cd python-server
   
   # Option 1: Using pip directly
   pip install -r requirements.txt
   
   # Option 2: Using virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Start the server
   python app.py
   ```

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel
4. Deploy

### Backend (Render, Heroku, etc.)

1. Choose a Python hosting service
2. Set up environment variables
3. Deploy the `python-server` directory
4. Update your frontend's `NEXT_PUBLIC_PYTHON_API_URL` to point to your deployed API

## Security Notes

- **NEVER** commit environment files (.env) with real credentials
- **NEVER** use the service role key in frontend code
- Ensure proper authentication for all API endpoints

## License

[MIT License](LICENSE)

## Contributors

- [Your Name](https://github.com/yourusername)

## Deployment Instructions

This project consists of two parts:
1. **Next.js Frontend**: Automatically deployed to Vercel
2. **Python Backend API**: Must be deployed separately

### Frontend Deployment

The frontend is configured to deploy automatically to Vercel and excludes the Python API code.

### Python API Deployment

The Python API requires:
- Python 3.8+ with build tools
- CMake and dlib dependencies

**Option 1: Run API on a server (recommended)**
1. Set up a server with Python and required dependencies
2. Clone the repository
3. Install dependencies: `cd api && pip install -r requirements.txt`
4. Run the server: `python -m uvicorn main:app --host 0.0.0.0 --port 8000`
5. Set the environment variable `NEXT_PUBLIC_FACE_API_URL` to your API URL in Vercel

**Option 2: Use a serverless Python provider**
- Deploy to a service like AWS Lambda, Google Cloud Functions, or Render that supports Python APIs
- Make sure to include build steps for installing dlib

## Local Development

To run the application locally:
1. Start the Python API: 
   ```
   cd api
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. In a separate terminal, start the Next.js frontend:
   ```
   npm install
   npm run dev
   ```

Alternatively, use the provided start script:
```
start_app.bat
```

## Important Notes

- The Face Recognition API requires dlib which needs C++ build tools and CMake
- Vercel cannot build Python packages with binary dependencies
- For production, deploy the API on a separate service and update the API URL 