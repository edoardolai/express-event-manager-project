# Event Manager - Full Stack Event Management System

A robust full-stack web application for managing events and ticket bookings, built with Node.js, Express, and SQLite. This project demonstrates practical implementation of web development concepts including authentication, session management, and database operations.



https://github.com/user-attachments/assets/f94c0c69-896e-4540-ad0e-bf08c7af0968



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
## 🌟 Future Improvements <br>
Migrate frontend to React/Vue.js for enhanced interactivity <br>
Introduce event categories and search functionality <br>
Improve analytics dashboard for organizers <br>
Implement test coverage

## 📝 License
This project is licensed under the ISC License.

## 🎓 Academic Context
This project was developed as part of a Databases, Networks, and the Web course for University of London, demonstrating practical implementation of:

Database design and management <br>
Web application architecture <br>
User authentication and authorization <br>
Input validation and security practices <br>
Session management <br>
RESTful API design <br>
