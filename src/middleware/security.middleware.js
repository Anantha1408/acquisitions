import aj from '#config/arcjet.js'
import res from "express/lib/response.js";
import req from "express/lib/request.js";
import {slidingWindow} from "@arcjet/node";
import logger from "#config/logger.js";
import app from "../app.js";

const securityMiddleware=async (req,res,next)=> {
    try {
        // Dev-only bypass to allow local testing (cookies, auth, etc.)
        // Bypass if:
        //  - NODE_ENV !== 'production' AND
        //  - header 'x-bypass-arcjet: 1' is present OR the path is /health or /api/auth/*

        const role = req.user?.role || 'guest';
        let limit;
        let message;
        switch (role) {
            case 'admin':
                limit = 20
                message = 'admin request limit exceeded'
                break;
            case 'user':
                limit = 10
                message = 'user request limit exceeded'
                break;
            case 'guest':
                limit = 5
                message = 'guest request limit exceeded'
                break;
        }
        const client = aj.withRule(slidingWindow({
            mode: 'LIVE',
            interval: '1m',
            max: limit,
            name: `${role}-rate-limit`
        }));

        const decision = await client.protect(req);
        if (decision.isDenied() && decision.reason.isBot()) {
            logger.warn('Bot request blocked', {ip: req.ip, userAgent: req.get('User-Agent'), path: req.path});
            return res.status(403).json({error: 'Forbidden', message: 'Automated requests are not allowed'});

        }
        if (decision.isDenied() && decision.reason.isShield()) {
            logger.warn('Shield request blocked', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method
            });
            return res.status(403).json({error: 'Forbidden', message: 'Request blocked by security policy'});

        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            logger.warn('Rate limit exceeded', {ip: req.ip, userAgent: req.get('User-Agent'), path: req.path});
            return res.status(403).json({error: 'Forbidden', message: 'too many requests are not allowed'});

        }
        next();
    } catch (e) {
        console.error('arcjet middleware error', e);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong with security middleware'
        });

    }
}
export default securityMiddleware;
