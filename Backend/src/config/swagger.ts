import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FlexAcademy API",
      version: "1.0.0",
      description:
        "AI-powered learning & exam practice platform for African students. WAEC, JAMB, NECO, IGCSE and more.",
      contact: { name: "FlexAcademy Dev Team", email: "dev@flexacademy.com" },
    },
    servers: [
      { url: "http://localhost:5000/api/v1", description: "Development" },
      { url: "https://api.flexacademy.com/api/v1", description: "Production" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
