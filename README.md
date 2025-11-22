# Workshop Booking System

A comprehensive workshop booking system with admin and student interfaces, featuring course management, enrollment tracking, QR code check-in, and analytics.

## Features

### Admin Features
- Create and manage courses
- View enrollment analytics
- Track check-ins and attendance
- Send reminder emails to enrolled students
- QR code check-in scanner

### Student Features
- Browse available courses
- Enroll in courses (with overlap prevention)
- View course details via shareable links
- Access QR codes for check-in
- View enrollment history

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: React with TypeScript
- **UI**: ShadCN components
- **Database**: SQLite (can be easily switched to PostgreSQL/MySQL)
- **Authentication**: JWT tokens
- **QR Codes**: qrcode library

## Project Structure

```
workshop-booking-system/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── config.py           # Configuration settings
│   ├── models.py           # Database models
│   ├── routes/             # API route handlers
│   │   ├── auth.py         # Authentication routes
│   │   ├── courses.py      # Course management routes
│   │   ├── enrollments.py  # Enrollment routes
│   │   ├── admin.py        # Admin analytics routes
│   │   └── checkin.py      # Check-in routes
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── lib/            # Utilities and API client
    │   └── contexts/       # React contexts
    └── package.json        # Node dependencies
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration:
   - Set `SECRET_KEY` and `JWT_SECRET_KEY` to secure random strings
   - Configure email settings if you want to use the reminder feature

6. Run the Flask application:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### Creating an Admin Account

You can create an admin account using the provided script:

```bash
cd backend
python create_admin.py <email> <password> <name>
```

Example:
```bash
python create_admin.py admin@example.com password123 "Admin User"
```

Alternatively, you can register a regular account and then use the script to update it to admin, or manually update the database.

### Creating Courses (Admin)

1. Log in as an admin
2. Navigate to the Admin Dashboard
3. Click "Create Course"
4. Fill in course details (title, description, start/end time, location, capacity)
5. Save the course

### Enrolling in Courses (Student)

1. Log in as a student
2. Browse available courses on the dashboard
3. Click "Enroll" on a course
4. View your QR code for check-in

### Check-In Process

1. Students receive a QR code upon enrollment
2. Admins can use the Check-In Scanner page to scan QR codes
3. Enter the QR code data manually or use a QR scanner
4. The system will verify and check in the student

### Sending Reminders (Admin)

1. Navigate to Admin Dashboard
2. Click "Send Reminders" on any course
3. All enrolled students will receive email reminders

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in a course
- `GET /api/enrollments/:id/qr` - Get enrollment QR code
- `DELETE /api/enrollments/:id` - Cancel enrollment

### Admin
- `GET /api/admin/analytics` - Get analytics for all courses
- `GET /api/admin/course/:id/analytics` - Get detailed course analytics
- `POST /api/admin/course/:id/reminders` - Send reminder emails

### Check-In
- `POST /api/checkin/verify` - Verify and process check-in (admin)
- `POST /api/checkin/scan` - Scan QR code (public)

## Development Notes

- The database is SQLite by default, stored as `workshop_booking.db` in the backend directory
- For production, consider switching to PostgreSQL or MySQL
- Email functionality requires proper SMTP configuration
- QR codes are generated server-side and returned as base64 images

## License

MIT

