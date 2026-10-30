import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../services/storage.ts';
import { generateToken, AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName } = req.body;

      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'researcher',
      });

      // Automatically create a default research workspace
      await storage.createWorkspace({
        user_id: newUser.id,
        name: 'My Research Projects',
        description: 'Default personal knowledge workspace for indexing papers and documents.',
        domain: 'General Science',
      });

      const token = generateToken(newUser);
      res.status(201).json({
        message: 'Account successfully registered.',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          role: newUser.role,
        },
      });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error during registration.' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await storage.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email address or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email address or password.' });
        return;
      }

      const token = generateToken(user);
      res.json({
        message: 'Authentication successful.',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during authentication.' });
    }
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    res.json({ user: req.user });
  },

  async demoLogin(_req: Request, res: Response): Promise<void> {
    try {
      const demoUser = await storage.findUserByEmail('researcher@pulse.ai');
      if (!demoUser) {
        res.status(404).json({ error: 'Demo user not seeded' });
        return;
      }

      const token = generateToken(demoUser);
      res.json({
        message: 'Demo credentials loaded.',
        token,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          fullName: demoUser.full_name,
          role: demoUser.role,
        },
      });
    } catch (err: any) {
      console.error('Demo login error:', err);
      res.status(500).json({ error: 'Server error during demo login.' });
    }
  },
};
