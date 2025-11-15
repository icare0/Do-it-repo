import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { AuthRequest } from '../types';
import { generateTokenPair } from '../utils/jwt';
import logger from '../config/logger';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({
      email,
      password,
      name,
      provider: 'local',
    });

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.status(201).json({
      user: user.toJSON(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.provider !== 'local' || !user.password) {
      res.status(401).json({ message: 'Please use OAuth to login' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json({
      user: user.toJSON(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const googleAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name || 'User',
        avatar: payload.picture,
        provider: 'google',
        providerId: payload.sub,
      });
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json({
      user: user.toJSON(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Refresh token required' });
      return;
    }

    const user = await User.findOne({ refreshTokens: token });
    if (!user) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ message: 'Token refresh failed' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (req.user && refreshToken) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};
