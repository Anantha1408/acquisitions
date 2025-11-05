import logger from "#config/logger.js";
import bcrypt from "bcrypt";
import {db} from "#config/database.js";
import {users} from "#models/user.model.js";
import {eq} from "drizzle-orm";

export const hashPassword=async(password)=>{
    try
    {
        return await bcrypt.hash(password, 10);

    }catch(err){
        logger.error(`error hashing password:${err}`);
        throw new Error('error hashing password');
    }
}

export const comparePassword=async(password, hashedPassword)=>{
    try
    {
        return await bcrypt.compare(password, hashedPassword);

    }catch(err){
        logger.error(`error comparing password:${err}`);
        throw new Error('error comparing password');
    }
}

export const authenticateUser=async({email, password})=>{
    try
    {
        const existingUser=await db.select().from(users).where(eq(users.email,email)).limit(1);
        if(existingUser.length===0){
            throw new Error('user not found');
        }

        const user = existingUser[0];
        const isPasswordValid = await comparePassword(password, user.password);
        
        if(!isPasswordValid){
            throw new Error('invalid password');
        }

        logger.info(`user authenticated successfully:${user.email}`);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at
        };
    }
    catch (error) {
        logger.error(`error authenticating user:${error}`);
        throw error;
    }
}

export const createUser=async({name,email,password,role='user'})=>{

    try
    {
        const existingUser=await db.select().from(users).where(eq(users.email,email)).limit(1);
        if(existingUser.length>0){
            throw new Error('user already exists');
        }

        const passwordHash=await hashPassword(password);
        const [newUser]=await db.insert(users).values({name,email,password:passwordHash,role}).returning({id:users.id,name:users.name,email:users.email,role:users.role,created_at:users.created_at});
        logger.info(`user registered successfully:${newUser.email}`);
        return newUser;
    }
    catch (error) {
        logger.error(`error creating the user:${error}`);
        throw error;
    }
}
