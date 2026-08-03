import { Router, Request, Response } from "express";
import { ChatType } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/require-auth";
import { getIo } from "../lib/socket";
import { canAccessChat } from "../lib/chat-access";
import { isValidAvatarColor } from "../lib/avatar-colors";

const router = Router();
const MAX_PARTICIPANTS = 100;

const GROUP_TYPES = [
  ChatType.PUBLIC_GROUP,
  ChatType.PRIVATE_GROUP,
  ChatType.PROTECTED_GROUP,
];

router.post(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { type, name, avatarColor, password, participantIds } = req.body;
    const creatorId = req.user!.id;

    if (!GROUP_TYPES.includes(type)) {
      res.status(400).json({ error: "Invalid chat type." });
      return;
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Group name is required." });
      return;
    }

    if (avatarColor && !isValidAvatarColor(avatarColor)) {
      res.status(400).json({ error: "Invalid avatar color." });
      return;
    }

    if (
      type === ChatType.PROTECTED_GROUP &&
      (!password || password.length < 4)
    ) {
      res
        .status(400)
        .json({
          error: "Protected groups need a password of at least 4 characters.",
        });
      return;
    }

    let memberIds: string[] = [creatorId];

    if (type === ChatType.PRIVATE_GROUP) {
      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        res
          .status(400)
          .json({ error: "Private groups need a participant list." });
        return;
      }
      if (participantIds.length > MAX_PARTICIPANTS) {
        res
          .status(400)
          .json({
            error: `Cannot add more than ${MAX_PARTICIPANTS} participants.`,
          });
        return;
      }
      const found = await prisma.user.findMany({
        where: { id: { in: participantIds } },
        select: { id: true },
      });
      memberIds = [...new Set([creatorId, ...found.map((u) => u.id)])];
    }
    try {
      const chat = await prisma.chat.create({
        data: {
          type,
          name: name.trim(),
          avatarColor: avatarColor ?? null,
          password:
            type === ChatType.PROTECTED_GROUP
              ? await bcrypt.hash(password, 10)
              : null,
          participants: {
            create: memberIds.map((userId) => ({ userId })),
          },
        },
        select: {
          id: true,
          type: true,
          name: true,
          avatarColor: true,
          createdAt: true,
        },
      });

      const payload = {
        ...chat,
        participantCount: memberIds.length,
        isMember: false,
      };

      console.log("[socket] emitting chat_created", chat.id, type);

      if (type === ChatType.PRIVATE_GROUP) {
        for (const memberId of memberIds) {
          getIo()
            .to(`user:${memberId}`)
            .emit("chat_created", { ...payload, isMember: true });
        }
      } else {
        getIo().emit("chat_created", payload);
      }

      res.status(201).json({ chat: { ...payload, isMember: true } });
    } catch (error) {
      console.error("Failed to create chat:", error);
      res.status(500).json({ error: "Could not create chat." });
    }
  },
);

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    try {
      const chats = await prisma.chat.findMany({
        where: {
          OR: [
            { type: ChatType.PUBLIC_GROUP },
            {
              type: { in: [ChatType.PRIVATE_GROUP, ChatType.PROTECTED_GROUP] },
              participants: { some: { userId } },
            },
          ],
        },
        select: {
          id: true,
          type: true,
          name: true,
          avatarColor: true,
          createdAt: true,
          participants: {
            where: { userId },
            select: { id: true },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        chats: chats.map(({ participants, _count, ...chat }) => ({
          ...chat,
          isMember: participants.length > 0,
          participantCount: _count.participants,
        })),
      });
    } catch (error) {
      console.error("Failed to list chats:", error);
      res.status(500).json({ error: "Could not load chats." });
    }
  },
);

router.get(
  "/:id/messages",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = String(req.params.id);

    if (!(await canAccessChat(userId, chatId))) {
      res.status(403).json({ error: "No access to this chat." });
      return;
    }

    try {
      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          chatId: true,
          content: true,
          createdAt: true,
          userId: true,
          user: { select: { username: true, avatarColor: true } },
        },
      });
      res.json({ messages });
    } catch (error) {
      console.error("Failed to load messages:", error);
      res.status(500).json({ error: "Could not load messages." });
    }
  },
);

router.post(
  "/:id/join",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = String(req.params.id);
    const { password } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true, password: true },
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found." });
      return;
    }

    if (chat.type === ChatType.PROTECTED_GROUP) {
      if (
        !password ||
        !chat.password ||
        !(await bcrypt.compare(password, chat.password))
      ) {
        res.status(403).json({ error: "Incorrect password." });
        return;
      }
    } else if (chat.type !== ChatType.PUBLIC_GROUP) {
      res.status(403).json({ error: "Cannot join this chat directly." });
      return;
    }

    await prisma.chatParticipant.upsert({
      where: { userId_chatId: { userId, chatId } },
      create: { userId, chatId },
      update: {},
    });

    res.json({ joined: true });
  },
);

export default router;
