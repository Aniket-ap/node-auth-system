import DotenvFlow from 'dotenv-flow'
DotenvFlow.config()

export default {
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    DATABSE_URL: process.env.DATABSE_URL
}
