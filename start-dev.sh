#!/bin/bash

# FOCAL Senior Project Development Startup Script
echo "🚀 Starting FOCAL Senior Project with FlashCard Integration..."

# Kill any existing processes on ports 3001 and 5001
echo "🔄 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start backend server in background
echo "🔧 Starting Backend Server (Port 5001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting Frontend Server (Port 3001)..."
PORT=3001 DANGEROUSLY_DISABLE_HOST_CHECK=true npm start &
FRONTEND_PID=$!

# Print status
echo ""
echo "✅ Both servers are starting..."
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "💡 To stop both servers, press Ctrl+C"
echo "📝 Backend PID: $BACKEND_PID"
echo "📝 Frontend PID: $FRONTEND_PID"

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for frontend process
wait $FRONTEND_PID
