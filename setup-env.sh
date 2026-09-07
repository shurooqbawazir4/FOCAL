#!/bin/bash

echo "🔧 Setting up FOCAL environment variables..."

# Create .env file in backend directory
cat > backend/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# JWT Configuration
JWT_SECRET=focal-super-secret-jwt-key-2024
JWT_EXPIRE=7d

# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3001

# Email Configuration
EMAIL_USER=focal.otp@gmail.com
EMAIL_PASS=xtmu mtiz szzo srgc

# Session Configuration
SESSION_SECRET=focal-session-secret-key-2024

# OpenAI Configuration (for flashcard generation)
OPENAI_API_KEY=your_openai_api_key_here
EOF

echo "✅ Environment file created at backend/.env"
echo ""
echo "⚠️  IMPORTANT: Please update the following values in backend/.env:"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_SERVICE_KEY: Your Supabase service key"
echo "   - OPENAI_API_KEY: Your OpenAI API key (for flashcard generation)"
echo ""
echo "🚀 You can now run the application with: ./start-dev.sh"
