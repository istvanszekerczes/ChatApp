import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/authentication";
import authRoutes from "./routes/auth.routes";
import { prisma } from "./lib/prisma";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";
import { setIo } from "./lib/socket";
import { canAccessChat } from "./lib/chat-access";
import type { ErrorRequestHandler } from "express";
import { addConnection, removeConnection } from "./lib/presense";

dotenv.config();

const app = express();
const server = http.createServer(app);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setIo(io);

// Middleware setup
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
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
  next(new Error("unauthorized"));
});

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running!" });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// User and Chat routes
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

io.on("connection", (socket) => {
  const userId = (socket.request as ExpressRequest).user!.id;
  socket.join(`user:${userId}`);

  if (addConnection(userId)) {
    io.emit("presence_changed", { userId, online: true, lastOnline: null });
  }

  // Handling incoming real-time messages
  socket.on("join_chat", async (chatId: string) => {
    if (!(await canAccessChat(userId, chatId))) {
      socket.emit("error", { message: "No access to this chat" });
      return;
    }
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined room: ${chatId}`);
  });

  socket.on("leave_chat", (chatId: string) => {
    socket.leave(chatId);
  });

  socket.on(
    "send_message",
    async (data: { chatId: string; content: string }) => {
      const content = (data.content ?? "").trim();
      if (!content) return;

      if (!(await canAccessChat(userId, data.chatId))) {
        socket.emit("error", { message: "No access to this chat" });
        return;
      }

      try {
        const savedMessage = await prisma.message.create({
          data: {
            content,
            chatId: data.chatId,
            userId,
          },
          select: {
            id: true,
            chatId: true,
            content: true,
            createdAt: true,
            userId: true,
            user: { select: { username: true, avatarColor: true } },
          },
        });

        io.to(data.chatId).emit("receive_message", savedMessage);
      } catch (error) {
        console.error("Failed to save and send message:", error);
        socket.emit("error", { message: "Could not send message" });
      }
    },
  );

  socket.on("disconnect", async () => {
    if (!removeConnection(userId)) return;

    const lastOnline = new Date();
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastOnline },
      });
    } catch (error) {
      console.error("Failed to update lastOnline:", error);
    }

    io.emit("presence_changed", { userId, online: false, lastOnline });
  });
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ error: "Internal server error." });
};
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
