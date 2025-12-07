# Finance Tracker

A modern, responsive personal finance tracker application built with React, featuring user authentication, animated charts, and transaction management.

## Features

- 🔐 **Authentication Pages**
  - Beautiful login page with email/password and Google sign-in option
  - Sign up page with form validation
  - Smooth navigation between auth pages

- 📊 **Interactive Dashboard**
  - Animated line chart showing balance trends over time
  - Summary cards displaying Total Balance, Monthly Income, and Monthly Expenses
  - Recent transactions list with scrollable view
  - Clean, modern UI with smooth animations

- 🎨 **Modern Design**
  - Responsive layout that works on all devices
  - Clean, minimalist interface
  - Smooth transitions and hover effects
  - Professional color scheme with green accents

## Tech Stack

- **React 18** - UI library
- **React Router** - Navigation and routing
- **Recharts** - Animated charts and data visualization
- **Vite** - Fast build tool and dev server
- **CSS3** - Modern styling with flexbox and grid

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Finance_Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Project Structure

```
Finance_Tracker/
├── src/
│   ├── pages/
│   │   ├── Login.jsx          # Login page component
│   │   ├── SignUp.jsx         # Sign up page component
│   │   ├── Dashboard.jsx      # Main dashboard component
│   │   ├── Auth.css           # Styles for auth pages
│   │   └── Dashboard.css      # Styles for dashboard
│   ├── App.jsx                # Main app component with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
└── README.md                  # This file
```

## Usage

1. **Login/Sign Up**: Navigate to the login page and either sign in with existing credentials or create a new account
2. **Dashboard**: After authentication, you'll be redirected to the dashboard
3. **View Transactions**: Scroll down on the dashboard to see recent transactions
4. **Chart Animation**: The balance trend chart animates on page load

## Future Enhancements

- Backend integration for real user authentication
- Database integration for persistent data storage
- Add/edit/delete transaction functionality
- Category management
- Advanced analytics and reporting
- Data export functionality
- Dark mode support

## License

This project is open source and available under the MIT License.
