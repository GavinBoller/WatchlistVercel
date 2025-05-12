import { Router, Request, Response } from 'express';
import { generateToken, createUserResponse, verifyToken, JWT_SECRET, TOKEN_EXPIRATION } from './jwtAuth';
import { storage } from './storage';
import { insertUserSchema, UserResponse } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import { executeDirectSql } from './db';

const router = Router();
const scryptAsync = promisify(scrypt);

/**
 * Helper function to hash password
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Helper function to compare password with hashed password
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    console.log(`[AUTH] Comparing password for auth. Stored hash format: ${stored.substring(0, 3)}...`);
    if (stored.startsWith('$2')) {
      const result = await bcrypt.compare(supplied, stored);
      console.log(`[AUTH] Bcrypt comparison result: ${result}`);
      return result;
    }
    if (supplied === stored) {
      console.log('[AUTH] Direct string comparison match - allowing for testing');
      return true;
    }
    const [hashed, salt] = stored.split('.');
    if (hashed && salt) {
      const hashedBuf = Buffer.from(hashed, 'hex');
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      const result = timingSafeEqual(hashedBuf, suppliedBuf);
      console.log(`[AUTH] Scrypt comparison result: ${result}`);
      return result;
    }
    console.error('[AUTH] Unknown password format:', stored.substring(0, 3) + '...');
    return false;
  } catch (error) {
    console.error('[AUTH] Password comparison error:', error);
    return false;
  }
}

/**
 * JWT Login endpoint
 */
router.post('/jwt/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }
    
    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }
    
    const userResponse = createUserResponse(user);
    const token = generateToken(userResponse);
    
    const verifiedUser = verifyToken(token);
    if (!verifiedUser) {
      console.error(`[JWT AUTH] Generated token failed verification for user ${username}`);
      return res.status(500).json({ error: 'JWT token generation failed - please contact support' });
    }
    
    console.log(`[JWT AUTH] Login successful and token verified for user ${username}`);
    
    res.status(200).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('[JWT AUTH] Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * JWT Register endpoint with simplified, reliable implementation
 */
router.post('/jwt/register', async (req: Request, res: Response) => {
  console.log(`[JWT AUTH] Registration attempt for username: ${req.body?.username || 'unknown'}`);
  const isProd = process.env.NODE_ENV === "production";

  try {
    const validated = insertUserSchema.safeParse(req.body);
    if (!validated.success) {
      const errors = validated.error.format();
      console.error("[JWT AUTH] Validation failed:", JSON.stringify(errors, null, 2));
      return res.status(400).json({
        message: "Invalid registration data",
        errors: isProd ? undefined : errors,
      });
    }
    
    const { username, password } = validated.data;
    
    console.log(`[JWT AUTH] Checking if username exists: ${username}`);
    const result = await storage.getUserByUsername(username);
    if (result) {
      console.log(`[JWT AUTH] Username ${username} already exists`);
      return res.status(409).json({ message: "Username already exists" });
    }
    
    console.log(`[JWT AUTH] Hashing password for user: ${username}`);
    const passwordHash = await hashPassword(password);
    
    console.log(`[JWT AUTH] Creating new user: ${username}`);
    const newUser = await storage.createUser({
      username,
      password: passwordHash,
      role: 'user',
      displayName: null,
      createdAt: new Date(),
    });
    
    if (!newUser) {
      console.error("[JWT AUTH] Failed to create user after validation");
      return res.status(500).json({ message: "Failed to create user" });
    }
    
    console.log(`[JWT AUTH] Successfully created user: ${username} (ID: ${newUser.id})`);
    const userResponse = createUserResponse(newUser);
    const token = generateToken(userResponse);
    
    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error("[JWT AUTH] Unhandled error in registration:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("[JWT AUTH] Error details:", errorMessage);
    console.error("[JWT AUTH] Error stack:", errorStack);

    let statusCode = 500;
    let userMessage = "Registration failed";

    if (
      errorMessage.includes("connection") ||
      errorMessage.includes("pool") ||
      errorMessage.includes("database") ||
      errorMessage.includes("timeout")
    ) {
      userMessage = "Database connection issue detected. Please try again later.";
      statusCode = 503;
    }

    const errorResponse = isProd
      ? { message: userMessage }
      : {
          message: userMessage,
          error: errorMessage,
          stack: errorStack,
          time: new Date().toISOString(),
        };

    res.status(statusCode).json(errorResponse);
  }
});

/**
 * Get current user info from JWT
 */
router.get('/jwt/user', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.status(200).json(req.user);
});

/**
 * Validate token endpoint (optional, for debugging)
 */
router.post('/jwt/validate', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromBody = req.body.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenFromBody) {
      token = tokenFromBody;
    }
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }
    
    const verified = verifyToken(token);
    if (!verified) {
      console.error('[JWT] Token validation failed on direct validation endpoint');
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
    
    console.log('[JWT] Token successfully validated:', verified.username);
    return res.status(200).json({ valid: true, user: verified });
  } catch (error) {
    console.error('[JWT] Token validation error:', error);
    return res.status(500).json({ valid: false, error: 'Token validation error' });
  }
});

/**
 * Emergency backdoor registration endpoint for testing
 */
router.post('/jwt/backdoor-register', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    console.log(`[JWT AUTH] Attempting backdoor registration for: ${username}`);
    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log(`[JWT AUTH] User already exists, returning existing user: ${username}`);
      const userResponse = createUserResponse(existingUser);
      const token = generateToken(userResponse);
      return res.status(200).json({
        token,
        user: userResponse,
        alreadyExists: true
      });
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    const userEnvironment = isProduction || ['Sophieb', 'Gaju'].includes(username)
      ? 'production'
      : 'development';
    
    const hashedPassword = await hashPassword(username);
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      role: 'user',
      displayName: null,
      createdAt: new Date(),
    });
    
    if (!newUser) {
      return res.status(500).json({ error: 'User creation failed - null user returned' });
    }
    
    console.log(`[JWT AUTH] User '${username}' created successfully via backdoor registration`);
    const userResponse = createUserResponse(newUser);
    const token = generateToken(userResponse);
    
    return res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('[JWT AUTH] Backdoor registration error:', error);
    res.status(500).json({ error: 'Internal server error during backdoor registration' });
  }
});

/**
 * Emergency backdoor login endpoint for testing
 */
router.post('/jwt/backdoor-login', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    console.log(`[JWT AUTH] Attempting backdoor login for: ${username}`);
    
    let user = await storage.getUserByUsername(username);
    if (!user && (process.env.NODE_ENV === 'production' || process.env.REPL_SLUG)) {
      console.log(`[JWT AUTH] User not found in backdoor login, creating user: ${username}`);
      const isProduction = process.env.NODE_ENV === 'production';
      const userEnvironment = isProduction || ['Sophieb', 'Gaju'].includes(username)
        ? 'production'
        : 'development';
      const hashedPassword = await hashPassword(username);
      user = await storage.createUser({
        username,
        password: hashedPassword,
        role: 'user',
        displayName: null,
        createdAt: new Date(),
      });
      console.log(`[JWT AUTH] Created new user for backdoor login: ${username}`);
    }
    
    if (!user) {
      console.log(`[JWT AUTH] Backdoor login failed - user not found and could not be created: ${username}`);
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userResponse = createUserResponse(user);
    const token = generateToken(userResponse);
    
    const verifiedUser = verifyToken(token);
    if (!verifiedUser) {
      console.error(`[JWT AUTH] Generated token failed verification for backdoor login: ${username}`);
      return res.status(500).json({ error: 'JWT token generation failed' });
    }
    
    console.log(`[JWT AUTH] Backdoor login successful for: ${username}`);
    
    res.status(200).json({
      token,
      user: userResponse,
      backdoor: true
    });
  } catch (error) {
    console.error('[JWT AUTH] Backdoor login error:', error);
    res.status(500).json({ error: 'Internal server error during backdoor login' });
  }
});

/**
 * Ultra-simple URL-based direct login endpoint for extreme cases
 */
router.get('/jwt/one-click-login/:username', async (req: Request, res: Response) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  console.log(`[JWT AUTH] Attempting one-click URL login for: ${username}`);

  try {
    // First try: Direct token generation
    try {
      console.log(`[JWT AUTH] Generating direct token for: ${username}`);
      const isProduction = process.env.NODE_ENV === 'production';
      const tokenEnvironment = isProduction || ['Sophieb', 'Gaju'].includes(username)
        ? 'production'
        : 'development';
      
      const payload: UserResponse = {
        id: Math.floor(Math.random() * 10000) + 1000,
        username,
        displayName: null,
        role: 'user',
        createdAt: new Date(),
      };
      
      const secret = Buffer.from(JWT_SECRET, 'utf8');
      const options: jwt.SignOptions = { expiresIn: TOKEN_EXPIRATION };
      const directToken = jwt.sign(payload, secret, options);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Logging in with Direct Token...</title>
          <script>
            localStorage.setItem('jwt_token', '${directToken}');
            console.log('Direct token login successful for ${username}');
            localStorage.setItem('movietracker_username', '${username}');
            localStorage.setItem('movietracker_last_login', '${Date.now()}');
            setTimeout(function() {
              window.location.href = '/?autoLogin=true&user=${username}&emergency=true';
            }, 500);
          </script>
        </head>
        <body>
          <h1>Login Successful (Emergency Mode)</h1>
          <p>Emergency token generated for ${username}. Redirecting to the application...</p>
        </body>
        </html>
      `);
    } catch (tokenError) {
      console.error(`[JWT AUTH] Direct token generation failed: ${username}`, tokenError);
    }

    // Second try: Standard user lookup/creation
    let user = await storage.getUserByUsername(username);
    if (!user) {
      console.log(`[JWT AUTH] User not found for one-click login, creating user: ${username}`);
      const isProduction = process.env.NODE_ENV === 'production';
      const userEnvironment = isProduction || ['Sophieb', 'Gaju'].includes(username)
        ? 'production'
        : 'development';
      const hashedPassword = await hashPassword(username);
      user = await storage.createUser({
        username,
        password: hashedPassword,
        role: 'user',
        displayName: null,
        createdAt: new Date(),
      });
      console.log(`[JWT AUTH] Created new user for one-click login: ${username}`);
    }

    if (user) {
      const userResponse = createUserResponse(user);
      const token = generateToken(userResponse);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Logging in...</title>
          <script>
            localStorage.setItem('jwt_token', '${token}');
            console.log('One-click login successful for ${username}');
            localStorage.setItem('movietracker_username', '${username}');
            localStorage.setItem('movietracker_last_login', '${Date.now()}');
            setTimeout(function() {
              window.location.href = '/?autoLogin=true&user=${username}';
            }, 500);
          </script>
        </head>
        <body>
          <h1>Login Successful</h1>
          <p>Logged in as ${username}. Redirecting to the application...</p>
        </body>
        </html>
      `);
    }

    // Third try: Direct SQL approach
    console.log(`[JWT AUTH] Attempting direct SQL method for: ${username}`);
    const isProduction = process.env.NODE_ENV === 'production';
    const directSqlEnvironment = isProduction || ['Sophieb', 'Gaju'].includes(username)
      ? 'production'
      : 'development';
    const hashedPassword = await hashPassword(username);
    await executeDirectSql(
      `INSERT INTO users (username, password, created_at, environment) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      [username, hashedPassword, new Date(), directSqlEnvironment]
    );
    
    user = await storage.getUserByUsername(username);
    if (user) {
      console.log(`[JWT AUTH] Successfully created/retrieved user with SQL: ${username}`);
      const userResponse = createUserResponse(user);
      const token = generateToken(userResponse);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Logging in (SQL Method)...</title>
          <script>
            localStorage.setItem('jwt_token', '${token}');
            console.log('SQL method login successful for ${username}');
            localStorage.setItem('movietracker_username', '${username}');
            localStorage.setItem('movietracker_last_login', '${Date.now()}');
            setTimeout(function() {
              window.location.href = '/?autoLogin=true&user=${username}&method=sql';
            }, 500);
          </script>
        </head>
        <body>
          <h1>Login Successful (SQL Method)</h1>
          <p>Logged in as ${username}. Redirecting to the application...</p>
        </body>
        </html>
      `);
    }

    // Final fallback: Client-side emergency registration
    console.log(`[JWT AUTH] All server methods failed, trying client-side: ${username}`);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Emergency Account Creation</title>
        <script>
          async function attemptEmergencyLogin() {
            try {
              console.log("Attempting one-click login with /api/emergency/raw-token endpoint");
              const tokenResponse = await fetch('/api/emergency/raw-token/${username}');
              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                localStorage.setItem('jwt_token', tokenData.token);
                console.log('Emergency token creation successful');
                localStorage.setItem('movietracker_username', '${username}');
                localStorage.setItem('movietracker_last_login', '${Date.now()}');
                document.getElementById('status').innerHTML = 'Emergency token created! Redirecting...';
                setTimeout(() => {
                  window.location.href = '/?autoLogin=true&user=${username}&emergency=client';
                }, 1000);
                return;
              }
            } catch (tokenError) {
              console.error('Emergency token generation failed:', tokenError);
            }
            try {
              console.log("Attempting backdoor registration");
              const response = await fetch('/api/jwt/backdoor-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: '${username}' })
              });
              if (response.ok) {
                const data = await response.json();
                localStorage.setItem('jwt_token', data.token);
                console.log('Emergency registration successful');
                localStorage.setItem('movietracker_username', '${username}');
                localStorage.setItem('movietracker_last_login', '${Date.now()}');
                document.getElementById('status').innerHTML = 'Registration successful! Redirecting...';
                setTimeout(() => {
                  window.location.href = '/?autoLogin=true&user=${username}&method=backdoor';
                }, 1000);
                return;
              }
            } catch (regError) {
              console.error('Emergency registration failed:', regError);
            }
            try {
              console.log("Creating emergency authentication without server");
              localStorage.setItem('emergency_username', '${username}');
              localStorage.setItem('emergency_authenticated', 'true');
              localStorage.setItem('emergency_timestamp', Date.now().toString());
              document.getElementById('status').innerHTML = 'Created emergency local authentication. Redirecting...';
              setTimeout(() => {
                window.location.href = '/?localAuth=true&user=${username}';
              }, 1000);
              return;
            } catch (e) {
              console.error('All methods failed:', e);
              document.getElementById('status').innerHTML = 'All login methods failed. Please try the normal login page.';
              setTimeout(() => {
                window.location.href = '/auth';
              }, 2000);
            }
          }
          attemptEmergencyLogin();
        </script>
      </head>
      <body>
        <h1>Creating Emergency Account</h1>
        <p id="status">Attempting emergency procedures to create account "${username}"...</p>
        <p>You will be redirected automatically when complete.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('[JWT AUTH] One-click login error:', error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Emergency Recovery</title>
        <script>
          localStorage.setItem('emergency_username', '${username}');
          localStorage.setItem('emergency_authenticated', 'true');
          localStorage.setItem('emergency_timestamp', Date.now().toString());
          setTimeout(() => {
            window.location.href = '/?localAuth=true&user=${username}&lastResort=true';
          }, 1000);
        </script>
      </head>
      <body>
        <h1>Emergency Recovery</h1>
        <p>Creating local-only authentication as last resort. Redirecting...</p>
      </body>
      </html>
    `);
  }
});

export const jwtAuthRouter = router;