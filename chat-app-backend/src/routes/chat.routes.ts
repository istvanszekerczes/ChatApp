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

/**
 * GET /api/chats
 * List all chats the user has access to.
 * Public and protected groups are always visible, while private groups and direct messages are only visible if the user is a participant.
 */
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    try {
      const chats = await prisma.chat.findMany({
        where: {
          OR: [
            { type: { in: [ChatType.PUBLIC_GROUP, ChatType.PROTECTED_GROUP] } },
            {
              type: { in: [ChatType.PRIVATE_GROUP, ChatType.DIRECT] },
              participants: { some: { userId } },
            },
          ],
        },
        select: {
          id: true,
          type: true,
          name: true,
          creatorId: true,
          avatarColor: true,
          createdAt: true,
          participants: {
            select: {
              userId: true,
              user: { select: { id: true, username: true, avatarColor: true } },
            },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      /** 
       * Map the chats to include participant count and isMember flag
       * For direct messages, also include the other user's info
       */ 

      res.json({
        chats: chats.map(({ participants, _count, ...chat }) => {
          const isMember = participants.some((p) => p.userId === userId);

          if (chat.type === ChatType.DIRECT) {
            const other = participants.find((p) => p.userId !== userId)?.user;
            return {
              ...chat,
              name: other?.username ?? "Unknown user",
              avatarColor: other?.avatarColor ?? null,
              otherUserId: other?.id ?? null,
              isMember,
              participantCount: _count.participants,
            };
          }

          return { ...chat, isMember, participantCount: _count.participants };
        }),
      });
    } catch (error) {
      console.error("Failed to list chats:", error);
      res.status(500).json({ error: "Could not load chats." });
    }
  },
);

/**
 * POST /api/chats
 * Create a new chat. Only group chats can be created via this endpoint.
 */
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
      res.status(400).json({
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
        res.status(400).json({
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
          avatarColor: avatarColor || null,
          creatorId,
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
          creatorId: true,
        },
      });

      // Notify participants about the new chat
      const payload = {
        ...chat,
        participantCount: memberIds.length,
        isMember: false,
      };

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


/**
 * GET /api/chats/:id/messages
 * List the last 100 messages of a chat. Only accessible if the user is a participant or if the chat is public/protected.
 */
router.get(
  "/:id/messages",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = req.params.id;

    if (!(await canAccessChat(userId, chatId))) {
      res.status(403).json({ error: "No access to this chat." });
      return;
    }

    try {
      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "desc" },
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
      messages.reverse();
      res.json({ messages });
    } catch (error) {
      console.error("Failed to load messages:", error);
      res.status(500).json({ error: "Could not load messages." });
    }
  },
);

/**
 * POST /api/chats/:id/join
 * Join a protected group chat. Private groups cannot be joined directly.
 */
router.post(
  "/:id/join",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = req.params.id;
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

    // Check if the chat has reached the maximum number of participants
    const currentCount = await prisma.chatParticipant.count({
      where: { chatId },
    });
    if (currentCount >= MAX_PARTICIPANTS) {
      res.status(400).json({
        error: `Chat cannot exceed ${MAX_PARTICIPANTS} participants.`,
      });
      return;
    }

    await prisma.chatParticipant.upsert({
      where: { userId_chatId: { userId, chatId } },
      create: { userId, chatId },
      update: {},
    });

    const participantCount = await prisma.chatParticipant.count({
      where: { chatId },
    });
    getIo().to(chatId).emit("participants_changed", { chatId, participantCount });

    res.json({ joined: true });
  },
);

/**
 * POST /api/chats/direct
 * Create or retrieve a direct message chat between the authenticated user and another user.
 */
router.post(
  "/direct",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const me = req.user!;
    const { targetId } = req.body;

    if (!targetId || typeof targetId !== "string" || targetId === me.id) {
      res.status(400).json({ error: "Invalid user." });
      return;
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, username: true, avatarColor: true },
    });

    if (!target) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const CHAT_FIELDS = {
      id: true, type: true, name: true, avatarColor: true,
      createdAt: true, creatorId: true,
    } as const;

    try {
      const existing = await prisma.chat.findFirst({
        where: {
          type: ChatType.DIRECT,
          AND: [
            { participants: { some: { userId: me.id } } },
            { participants: { some: { userId: targetId } } },
          ],
        },
        select: CHAT_FIELDS,
      });

      const chat = existing ?? await prisma.chat.create({
        data: {
          type: ChatType.DIRECT,
          creatorId: me.id,
          participants: { create: [{ userId: me.id }, { userId: targetId }] },
        },
        select: CHAT_FIELDS,
      });

      const payload = {
        ...chat,
        name: target.username,
        avatarColor: target.avatarColor,
        otherUserId: target.id,
        participantCount: 2,
        isMember: true,
      };

      if (!existing) {
        getIo().to(`user:${targetId}`).emit("chat_created", {
          ...payload,
          name: me.username,
          avatarColor: me.avatarColor,
          otherUserId: me.id,
        });
      }

      res.status(existing ? 200 : 201).json({ chat: payload });
    } catch (error) {
      console.error("Failed to create direct chat:", error);
      res.status(500).json({ error: "Could not create conversation." });
    }
  },
);

/**
 * GET /api/chats/:id/participants
 * List all participants of a chat. Only accessible if the user is a participant or if the chat is public/protected.
 */
router.get(
  "/:id/participants",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = req.params.id;

    if (!(await canAccessChat(userId, chatId))) {
      res.status(403).json({ error: "No access to this chat." });
      return;
    }

    try {
      const participants = await prisma.chatParticipant.findMany({
        where: { chatId },
        select: {
          user: { select: { id: true, username: true, avatarColor: true } },
        },
        orderBy: { user: { username: "asc" } },
      });

      res.json({ participants: participants.map((p) => p.user) });
    } catch (error) {
      console.error("Failed to load participants:", error);
      res.status(500).json({ error: "Could not load participants." });
    }
  },
);

/**
 * POST /api/chats/:id/participants
 * Add participants to a private group chat. Only the group owner can add members.
 */
router.post(
  "/:id/participants",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = req.params.id;
    const { userIds } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { creatorId: true, type: true },
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found." });
      return;
    }
    if (chat.type !== ChatType.PRIVATE_GROUP) {
      res
        .status(400)
        .json({ error: "Members can only be added to private groups." });
      return;
    }
    if (chat.creatorId !== userId) {
      res.status(403).json({ error: "Only the group owner can add members." });
      return;
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: "No users provided." });
      return;
    }

    const currentCount = await prisma.chatParticipant.count({
      where: { chatId },
    });
    if (currentCount + userIds.length > MAX_PARTICIPANTS) {
      res.status(400).json({
        error: `Chat cannot exceed ${MAX_PARTICIPANTS} participants.`,
      });
      return;
    }

    try {
      const found = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, avatarColor: true },
      });

      await prisma.chatParticipant.createMany({
        data: found.map((u) => ({ userId: u.id, chatId })),
        skipDuplicates: true,
      });

      for (const u of found) {
        getIo().to(`user:${u.id}`).emit("added_to_chat", { chatId });
      }

      const participantCount = await prisma.chatParticipant.count({
        where: { chatId },
      });
      getIo()
        .to(chatId)
        .emit("participants_changed", { chatId, participantCount });

      res.json({ added: found });
    } catch (error) {
      console.error("Failed to add participants:", error);
      res.status(500).json({ error: "Could not add members." });
    }
  },
);

/**
 * DELETE /api/chats/:id/participants/:userId
 * Remove a participant from a chat. Only the group owner can remove other members. Participants can leave the chat themselves.
 */
router.delete(
  "/:id/participants/:userId",
  requireAuth,
  async (
    req: Request<{ id: string; userId: string }>,
    res: Response,
  ): Promise<void> => {
    const requesterId = req.user!.id;
    const chatId = req.params.id;
    const targetId = req.params.userId;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { creatorId: true, type: true },
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found." });
      return;
    }

    const isSelf = requesterId === targetId;
    const isOwner = chat.creatorId === requesterId;

    if (!isSelf && chat.type !== ChatType.PRIVATE_GROUP) {
      res
        .status(400)
        .json({ error: "Members can only be removed from private groups." });
      return;
    }
    if (!isSelf && !isOwner) {
      res
        .status(403)
        .json({ error: "Only the group owner can remove members." });
      return;
    }
    if (isSelf && isOwner) {
      res
        .status(400)
        .json({ error: "The owner cannot leave. Delete the group instead." });
      return;
    }
    if (!isSelf && targetId === chat.creatorId) {
      res.status(400).json({ error: "The owner cannot be removed." });
      return;
    }

    try {
      await prisma.chatParticipant.deleteMany({
        where: { chatId, userId: targetId },
      });

      getIo().to(`user:${targetId}`).emit("removed_from_chat", { chatId });
      getIo().in(`user:${targetId}`).socketsLeave(chatId);

      const participantCount = await prisma.chatParticipant.count({
        where: { chatId },
      });
      getIo()
        .to(chatId)
        .emit("participants_changed", { chatId, participantCount });

      res.json({ removed: true });
    } catch (error) {
      console.error("Failed to remove participant:", error);
      res.status(500).json({ error: "Could not remove member." });
    }
  },
);

/**
 * DELETE /api/chats/:id
 * Delete a chat. Only the group owner can delete a group chat.
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const chatId = req.params.id;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { creatorId: true },
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found." });
      return;
    }
    if (chat.creatorId !== userId) {
      res
        .status(403)
        .json({ error: "Only the group owner can delete this chat." });
      return;
    }

    try {
      await prisma.chat.delete({ where: { id: chatId } });
      getIo().socketsLeave(chatId);
      getIo().emit("chat_deleted", { chatId });
      res.json({ deleted: true });
    } catch (error) {
      console.error("Failed to delete chat:", error);
      res.status(500).json({ error: "Could not delete chat." });
    }
  },
);

export default router;