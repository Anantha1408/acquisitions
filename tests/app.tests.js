import app from "#src/app.js";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";

describe('Api Endpoints', () => {
    describe('GET /health', () => {
        it('should return health status',async () => {

            const response=await request(app).get('/health').expect(200);
            expect(response.body).toHaveProperty('status','OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');

        });
    })
    describe('GET /api', () => {
        it('should return API running message', async () => {
            const response = await request(app).get('/api').expect(200);
            expect(response.body).toHaveProperty('message', 'Acquisitions API is running');
        });
    });

    describe('GET /nonexistent', () => {
        it('should return route not found error', async () => {
            const response = await request(app).get('/nonexistent').expect(401);
            expect(response.body).toHaveProperty('error', 'Route not found');
        });
    });

});