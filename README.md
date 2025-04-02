# BPIT Attendance System

A face recognition-based attendance management system for Bhagwan Parshuram Institute of Technology.

## Features

- User authentication with Supabase
- Student registration with face encoding
- Automated attendance using face recognition
- Dashboard for attendance statistics
- Secure data storage in Supabase

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