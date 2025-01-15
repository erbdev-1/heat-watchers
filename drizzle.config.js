const config = {
  dialect: "postgresql",
  schema: "./utils/db/schema.ts",
  out: "./drizzle.config.js",

  dbCredentials: {
    url: process.env.DATABASE_URL,
    connectionString: process.env.DATABASE_URL,
  },
};

export default config;
