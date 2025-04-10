# Sports Management System

A comprehensive web-based sports management system built with Node.js, React, and MongoDB, designed to streamline sports organization operations and enhance team management capabilities.

## 🌟 Features

- User Authentication and Authorization
- Team Management
- Player Profiles
- Schedule Management
- Performance Analytics
- Real-time Statistics
- Interactive Dashboards
- Reporting Tools

## 🚀 Tech Stack

- **Frontend**: React.js, Bootstrap, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Other Tools**: node-cron (for scheduled tasks)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4 or higher)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install all dependencies (server and client):
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Create `.env` files in both `server` and `client` directories
   - Configure necessary environment variables (see `.env.example` files)

## 🚀 Running the Application

### Development Mode

To run both frontend and backend in development mode:
```bash
npm start
```

To run only the backend:
```bash
npm run server
```

To run only the frontend:
```bash
npm run client
```

### Production Mode

To build and run in production:
```bash
npm run build
npm run start:prod
```

## 👥 User Types

1. **Administrators**
   - Full system access
   - User management
   - System configuration

2. **Coaches/Managers**
   - Team management
   - Player performance tracking
   - Schedule management

3. **Players**
   - Personal profile management
   - Performance statistics
   - Schedule viewing

## 🛠️ Additional Scripts

- Create admin user: `npm run create-admin`
- Create test users: `npm run create-test-users`

## 📊 Project Structure

```
sports-management-system/
├── client/               # Frontend React application
├── server/              # Backend Node.js application
├── package.json         # Project configuration
└── README.md           # Project documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📧 Contact

For any queries or support, please reach out to the project maintainers.