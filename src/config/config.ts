import DotenvFlow from 'dotenv-flow'
DotenvFlow.config()

export default {
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY,
    DATABSE_URL: process.env.DATABSE_URL
}
