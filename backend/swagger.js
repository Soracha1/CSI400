import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Music Upload API",
      version: "1.0.0",
      description:
        "API สำหรับระบบอัปโหลดเพลง, ดาวน์โหลด, ผู้ใช้งาน, และระบบ Redeem Code",
    },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            downloadCount: { type: "number" },
            uploadCount: { type: "number" },
            maxUpload: { type: "number" },
            maxDownload: { type: "number" },
            plan: { type: "string" },
            planStart: { type: "string", format: "date-time" },
            planExpire: { type: "string", format: "date-time" },
            favorites: { type: "array", items: { type: "string" } },
          },
        },
        Song: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            artist: { type: "string" },
            description: { type: "string" },
            bpm: { type: "number" },
            key: { type: "string" },
            mode: { type: "string" },
            type: { type: "string" },
            subtype: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            soundType: { type: "string" },
            filePath: { type: "string" },
            likes: { type: "number" },
            downloads: { type: "number" },
            user: { type: "string" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            type: { type: "string" },
            message: { type: "string" },
            user: { type: "string" },
            song: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RedeemCode: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string" },
            plan: { type: "string" },
            used: { type: "boolean" },
            usedBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./server.js"], // ใส่ path ของไฟล์ route ของคุณ
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Export named exports เพื่อใช้ใน server.js
export const swaggerServe = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(swaggerDocs);
