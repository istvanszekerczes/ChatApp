import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/authentication';
import authRoutes from './routes/auth.routes';
import { prisma } from './lib/prisma';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes'


dotenv.config();

const app = express();
const server = http.createServer(app);

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

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
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
});
app.use(sessionMiddleware);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());



// Share the same session/passport pipeline with socket.io so req.user is available on each socket
const wrap = (middleware: any) => (socket: any, next: (err?: Error) => void) =>
  middleware(socket.request as ExpressRequest, {} as ExpressResponse, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.use((socket, next) => {
  const req = socket.request as ExpressRequest;
  if (req.isAuthenticated?.()) return next();
  next(new Error('unauthorized'));
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// User and Chat routes
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

io.on('connection', (socket) => {
  const userId = (socket.request as ExpressRequest).user!.id;
  console.log(`User connected: ${socket.id} (userId: ${userId})`);

  // User joins a specific chat room
  socket.on('join_chat', (chatId: string) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined room: ${chatId}`);
  });

  // Handling incoming real-time messages
  socket.on('send_message', async (data: { chatId: string; content: string }) => {
    try {
      // Save message to PostgreSQL database using Prisma
      const savedMessage = await prisma.message.create({
        data: {
          content: data.content,
          chatId: data.chatId,
          userId,
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

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id} (userId: ${userId})`);
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastOnline: new Date() }
      });
    } catch (error) {
      console.error('Failed to update lastOnline:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});