import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/authentication';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware setup
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins a specific chat room
  socket.on('join_chat', (chatId: string) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined room: ${chatId}`);
  });

  // Handling incoming real-time messages
  socket.on('send_message', async (data: { chatId: string; userId: string; content: string }) => {
    try {
      // Save message to PostgreSQL database using Prisma
      const savedMessage = await prisma.message.create({
        data: {
          content: data.content,
          chatId: data.chatId,
          userId: data.userId,
        },
        include: {
          user: {
            select: { username: true }
          }
        }
      });

      // Broadcast the message to everyone in that specific chat room
      io.to(data.chatId).emit('receive_message', savedMessage);
    } catch (error) {
      console.error('Failed to save and send message:', error);
      socket.emit('error', { message: 'Could not send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});