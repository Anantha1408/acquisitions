import { jwttoken } from "#utils/jwt.js";
import logger from "#config/logger.js";

/**
 * Middleware to authenticate user via JWT token from cookies
 * Attaches user info to req.user if valid
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        
        if (!token) {
            logger.warn('Authentication failed: no token provided');
            return res.status(401).json({ 
                error: 'unauthorized', 
                message: 'authentication required - please sign in' 
            });
        }

        try {
            const payload = jwttoken.verify(token);
            
            // Attach user info to request for downstream use
            req.user = {
                id: payload.id,
                email: payload.email,
                role: payload.role
            };
            
            logger.info(`User authenticated: ${payload.email} (${payload.role})`);
            next();
        } catch (verifyError) {
            logger.warn('Authentication failed: invalid or expired token');
            return res.status(401).json({ 
                error: 'unauthorized', 
                message: 'invalid or expired token' 
            });
        }
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        return res.status(500).json({ 
            error: 'internal server error', 
            message: 'authentication failed' 
        });
    }
};

/**
 * Middleware factory to require specific role(s)
 * Must be used after authenticateToken middleware
 * @param {string|string[]} roles - Single role or array of allowed roles
 */
export const requireRole = (roles) => {
    // Normalize to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                logger.warn('Authorization failed: user not authenticated');
                return res.status(401).json({ 
                    error: 'unauthorized', 
                    message: 'authentication required' 
                });
            }

            // Check if user has required role
            if (!allowedRoles.includes(req.user.role)) {
                logger.warn(`Authorization failed: user ${req.user.email} with role ${req.user.role} attempted to access resource requiring ${allowedRoles.join(' or ')}`);
                return res.status(403).json({ 
                    error: 'forbidden', 
                    message: `access denied - requires ${allowedRoles.join(' or ')} role` 
                });
            }

            logger.info(`Authorization successful: user ${req.user.email} has required role ${req.user.role}`);
            next();
        } catch (error) {
            logger.error('Authorization middleware error:', error);
            return res.status(500).json({ 
                error: 'internal server error', 
                message: 'authorization failed' 
            });
        }
    };
};
