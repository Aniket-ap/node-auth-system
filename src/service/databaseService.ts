import mongoose from 'mongoose'
import config from '../config/config'
import userModel from '../model/userModel'
import { IUser } from '../types/userType'

export default {
    connect: async () => {
        try {
            await mongoose.connect(config.DATABSE_URL as string)
            return mongoose.connection
        } catch (error) {
            throw error
        }
    },
    findUserByEmailAddress: (emailAddress: string) => {
        return userModel.findOne({ emailAddress })
    },
    registerUser: (payload: IUser) => {
        return userModel.create(payload)
    },
    findUserByConfirmationTokenAndCode: (token: string, code: string) => {
        return userModel.findOne({
            'accountConfirmation.token': token,
            'accountConfirmation.code': code
        })
    }
}
