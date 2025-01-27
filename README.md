# Event Manager - Full Stack Event Management System

A robust full-stack web application for managing events and ticket bookings, built with Node.js, Express, and SQLite. This project demonstrates practical implementation of web development concepts including authentication, session management, and database operations.

## 🚀 Features

- **User Authentication & Authorization**

  - Secure login/signup system for event organizers
  - Password hashing with bcrypt
  - Session-based authentication
  - Role-based access control

- **Event Management**

  - Create, edit and publish events
  - Manage ticket types (Full price & Concessions)
  - Track ticket availability
  - View booking statistics

- **Booking System**

  - Public event browsing
  - Real-time ticket availability checking
  - Secure booking process
  - Multiple ticket type support

- **Site Customization**
  - Customizable site name and description
  - Per-organizer settings

## 🛠️ Technology Stack

- **Backend**

  - Node.js & Express.js
  - SQLite3 for data persistence
  - Express-session for authentication
  - Express-validator for input validation
  - EJS for server-side templating

- **Frontend**

  - TailwindCSS for styling
  - Responsive design
  - Custom dialog system for critical actions

- **Security**
  - bcrypt for password hashing
  - Input validation and sanitization
  - CSRF protection
  - Secure session management

## 📦 Installation

1. Clone the repository:

```bash
git clone [repository-url]
```

2. Install dependencies:

```bash
npm install
```

3.Initialize the database:

```bash
npm run build-db
# For Windows: npm run build-db-win
```

4. start server

```bash
npm run dev
```

🌟 Future Improvements
Migrate frontend to React/Vue.js for enhanced interactivity
Implement email notifications for bookings
Add payment gateway integration
Introduce event categories and search functionality
Add analytics dashboard for organizers
Implement test coverage
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📝 License
This project is licensed under the ISC License.

🎓 Academic Context
This project was developed as part of a Databases, Networks, and the Web course for University of London, demonstrating practical implementation of:

Database design and management
Web application architecture
User authentication and authorization
Input validation and security practices
Session management
RESTful API design
