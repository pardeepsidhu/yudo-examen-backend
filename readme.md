<h1 align="center">
  Yudo Examen – Backend
</h1>

<p align="center">
  <b>AI Powered Online Exam & Quiz Platform – Backend API</b><br/>
  This is the backend service for Yudo Examen, powering user authentication, test management, AI features, analytics, and more.
</p>

<p align="center">
  <a href="https://yudo-examen.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Live-Frontend-blue?style=flat-square" alt="Live Demo"></a>
  <img src="https://img.shields.io/github/license/yourusername/yudo-examen?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Node.js-18.x-green?style=flat-square" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-4.x-black?style=flat-square" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-6.x-brightgreen?style=flat-square" alt="MongoDB">
</p>

---

## 🚀 Features

- **RESTful API** for all platform features
- **User Authentication**: JWT, Google OAuth, OTP, password reset
- **Test & Quiz Management**: CRUD for tests, questions, and results
- **AI Integration**: OpenAI-powered content generation endpoints
- **Analytics**: User and test analytics endpoints
- **Media Support**: Upload and manage images and video links
- **Secure & Robust**: Input validation, error handling, and rate limiting

---

## 🖥️ Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/pardeepsidhu/yudo-examen-backend.git
cd yudo-examen/back-end
npm install
```

Create a `.env` file in the `back-end` directory and add your environment variables (see `.env.example` for reference).

Start the backend server:

```bash
npm run dev
```

The API will be available at [http://localhost:5000](http://localhost:5000) by default.

---

## 📦 API Endpoints

- `POST   /api/v1/user/register` – Register a new user
- `POST   /api/v1/user/login` – User login
- `POST   /api/v1/user/google-login` – Google OAuth login
- `POST   /api/v1/user/reset-password` – Reset password with token
- `GET    /api/v1/user/profile/:id` – Get user profile and tests
- `POST   /api/v1/test/create` – Create a new test
- `GET    /api/v1/test/all` – Get all tests
- `POST   /api/v1/ai/generate` – Generate content using AI
- ...and more!

See the code and comments for full API details.

---

## 🛠️ Tech Stack

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [OpenAI API](https://platform.openai.com/) (for AI features)
- [JWT](https://jwt.io/) (for authentication)
- [Nodemailer](https://nodemailer.com/) (for emails)

---

## 📚 Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Yudo Examen Frontend](https://yudo-examen.vercel.app)

---

## 📝 License

This project is licensed under the [MIT License](../LICENSE).

---

<p align="center">
  <b>Made with ❤️ by Pardeep Singh</b>
</p>