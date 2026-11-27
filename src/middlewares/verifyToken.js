import 'dotenv/config'; 
import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.FRONTEND_BASE_URI}/api/auth/jwks`)
)

 const verifyToken = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        // Check Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).send({
                success: false,
                message: "Unauthorized. Authentication token is required.",
            });
        }

        // Extract JWT from Bearer token
        const token = authHeader.split(" ")[1];
 
        // Verify JWT
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: process.env.BETTER_AUTH_URL,
            audience: process.env.BETTER_AUTH_URL,
        });



        // Attach authenticated user information to request
        req.user = payload;

        next();


    } catch (error) {
        console.error('Token validation failed:', error)
        
        return res.status(401).send({
            success: false,
            message: "Invalid or expired authentication token.",
        });
    }
}

export default verifyToken;