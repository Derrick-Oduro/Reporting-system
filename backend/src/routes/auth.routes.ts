import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import db from "../database/db";
import { authenticateToken, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("full_name").trim().notEmpty(),
    body("student_id").optional(),
    body("phone").optional(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, student_id, phone } = req.body;

    try {
      // Check if user exists
      const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const stmt = db.prepare(`
        INSERT INTO users (email, password, full_name, student_id, phone, role)
        VALUES (?, ?, ?, ?, ?, 'student')
      `);

      const result = stmt.run(
        email,
        hashedPassword,
        full_name,
        student_id,
        phone,
      );
      const userId = result.lastInsertRowid;

      // Generate token
      const jwtSecret = process.env.JWT_SECRET || "default-secret-key";
      const jwtExpiry = process.env.JWT_EXPIRES_IN || "7d";
      const token = jwt.sign({ userId, role: "student" }, jwtSecret, {
        expiresIn: jwtExpiry,
      } as jwt.SignOptions);

      // Get user data
      const user = db
        .prepare(
          `
        SELECT id, email, full_name, student_id, phone, role, created_at
        FROM users WHERE id = ?
      `,
        )
        .get(userId);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Get user
      const user: any = db
        .prepare(
          `
        SELECT id, email, password, full_name, student_id, phone, role, created_at
        FROM users WHERE email = ?
      `,
        )
        .get(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate token
      const jwtSecret = process.env.JWT_SECRET || "default-secret-key";
      const jwtExpiry = process.env.JWT_EXPIRES_IN || "7d";
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
        expiresIn: jwtExpiry,
      } as jwt.SignOptions);

      // Remove password from response
      delete user.password;

      res.json({
        message: "Login successful",
        token,
        user,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

// Get current user
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const user = db
      .prepare(
        `
      SELECT id, email, full_name, student_id, phone, role, created_at
      FROM users WHERE id = ?
    `,
      )
      .get(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

// Logout (client-side token removal, but we can log it)
router.post("/logout", authenticateToken, (req: AuthRequest, res: Response) => {
  // In a more advanced setup, you could blacklist the token here
  res.json({ message: "Logout successful" });
});

export default router;
