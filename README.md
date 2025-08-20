# Synapse

A modern full-stack web application built with React (Frontend) and FastAPI (Backend).

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **npm** or **yarn**

## 📁 Project Structure

```
Synapse/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # FastAPI Python API
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example   # Environment template
│   └── venv/
└── README.md
```

## 🛠️ Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   # Add your database URLs, API keys, etc.
   ```

6. **Run the development server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   
   Backend will be available at: `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at: `http://localhost:5173`

## 🔧 Development

### Backend Development
- **API Documentation:** Visit `http://127.0.0.1:8000/docs` (Swagger UI)
- **Alternative API Docs:** Visit `http://127.0.0.1:8000/redoc`
- **Health Check:** `http://127.0.0.1:8000/`

### Frontend Development
- Built with **React 18** + **Vite**
- Styled with **Tailwind CSS**
- Hot reload enabled for development

## 📋 Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
# With virtual environment activated
uvicorn app.main:app --reload    # Development server
uvicorn app.main:app             # Production server
```

## 🌐 Environment Variables

### Backend (.env)
Create a `.env` file in the `backend/` directory using `.env.example` as a template:

```env
# Database
DATABASE_URL=your_database_url_here

# API Keys
SECRET_KEY=your_secret_key_here
API_KEY=your_api_key_here

# Environment
ENVIRONMENT=development
DEBUG=true
```

**⚠️ Important:** Never commit your `.env` file to version control. Always use `.env.example` as a template.

## 🚀 Production Deployment

### Backend
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with production settings
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Build for production
npm run build

# Serve the dist/ folder with your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**
   - Backend: Change port with `uvicorn app.main:app --port 8001`
   - Frontend: Vite will automatically suggest an alternative port

2. **Virtual environment issues:**
   - Make sure you've activated the virtual environment before installing packages
   - On Windows, you might need to enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

3. **npm/node issues:**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`, then run `npm install`

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information