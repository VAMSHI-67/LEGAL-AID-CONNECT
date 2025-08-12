# LegalAid Connect

**Bridging Legal Access Through Technology**

A comprehensive digital platform designed to simplify and enhance access to legal assistance by seamlessly connecting individuals (clients) with suitable lawyers through intelligent matchmaking, digital communication tools, and accessible legal service listings.

## 🎯 Project Overview

LegalAid Connect addresses the challenges many individuals face in finding legal professionals due to lack of awareness, region-specific availability, or affordability issues. Our platform eliminates these barriers through:

- **Intelligent Matchmaking**: Advanced algorithm matching clients with lawyers based on domain, location, experience, and availability
- **Digital Communication**: Built-in chat and consultation scheduling
- **Case Management**: Comprehensive tracking and document management
- **Accessible Interface**: User-friendly design for all user types

## 🚀 Features

### For Clients
- User registration and authentication
- Post legal queries and case briefs
- View matched lawyers with detailed profiles
- Real-time chat and consultation scheduling
- Case progress tracking and document uploads

### For Lawyers
- Professional profile setup with domain expertise
- Accept or reject client requests
- Communicate with clients through integrated chat
- Case history and document management
- Availability status management

### For Administrators
- User verification and KYC management
- Role management (Client/Lawyer/Admin)
- Escalation support and dispute resolution
- Analytics and reporting dashboard

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.io
- **File Storage**: Cloudinary
- **Email Service**: Nodemailer
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **UI Components**: Lucide React Icons

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB database (local or Atlas)
- Cloudinary account (for file uploads)

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legalaid-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Server
   PORT=5000
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   # Run frontend only
   npm run dev
   
   # Run backend only
   npm run server:dev
   
   # Run both frontend and backend
   npm run dev:full
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏛️ Matchmaking Algorithm

Our intelligent matchmaking system uses a **Weighted Scoring-Based Algorithm**:

- **Domain Match** (Civil, Criminal, Corporate, etc.) → 40%
- **Location Proximity** (district/state matching) → 25%
- **Lawyer Availability Status** → 15%
- **Lawyer Rating/Experience** → 10%
- **Language Preference Match** → 10%

Each lawyer receives a composite score against each case, and top-N matches are presented to the client.

## 📁 Project Structure

```
legalaid-connect/
├── components/          # Reusable React components
├── pages/              # Next.js pages and API routes
├── backend/            # Express.js server
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── utils/          # Utility functions
│   └── server.js       # Main server file
├── public/             # Static assets
├── styles/             # Global styles
├── types/              # TypeScript type definitions
├── utils/              # Frontend utilities
└── hooks/              # Custom React hooks
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Testing
- Unit tests with Jest and React Testing Library
- Integration tests for API endpoints
- E2E testing for critical user flows

### Security
- Input validation on all endpoints
- Rate limiting for API routes
- Helmet.js for security headers
- JWT token validation
- Password hashing with bcrypt

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Backend (Render/Heroku)
1. Set up environment variables
2. Configure MongoDB Atlas connection
3. Deploy using the platform's CLI or dashboard

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Client Endpoints
- `POST /api/cases` - Create new case
- `GET /api/cases` - Get user's cases
- `GET /api/lawyers/matches` - Get matched lawyers

### Lawyer Endpoints
- `PUT /api/lawyers/profile` - Update profile
- `GET /api/cases/requests` - Get case requests
- `PUT /api/cases/:id/respond` - Accept/reject case

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/verify` - Verify user
- `GET /api/admin/analytics` - Get platform analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 SDG Alignment

This project aligns with the following **UN Sustainable Development Goals (SDGs)**:

- **SDG 16 – Peace, Justice and Strong Institutions**: Ensuring access to justice and legal services
- **SDG 10 – Reduced Inequalities**: Bridging legal access gaps
- **SDG 9 – Industry, Innovation and Infrastructure**: Leveraging technology for legal empowerment

## 📞 Support

For support, email support@legalaidconnect.com or create an issue in the repository.

---

**Built with ❤️ for better access to justice** 