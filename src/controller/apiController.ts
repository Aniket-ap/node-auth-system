import { IRegisterRequestBody, IUser } from './../types/userType'
import { NextFunction, Request, Response } from 'express'
import httpResponse from '../util/httpResponse'
import responseMessage from '../constant/responseMessage'
import httpError from '../util/httpError'
import quicker from '../util/quicker'
import { validateJoiSchema, validateRegisterBody } from '../service/validationService'
import databaseService from '../service/databaseService'
import { EUserRole } from '../types/userConstant'
import config from '../config/config'
import emailService from '../service/emailService'
import logger from '../util/logger'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

interface IRegisterRequest extends Request {
    body: IRegisterRequestBody
}

interface IConfirmrRequest extends Request {
    params: {
        token: string
    },
    query: {
        code: string
    }
}

export default {
    self: (req: Request, res: Response, next: NextFunction) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },
    health: (req: Request, res: Response, next: NextFunction) => {
        try {
            const healthData = {
                application: quicker.getApplicationHealth(),
                system: quicker.getSystemHealth(),
                timeStamp: Date.now()
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, healthData)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },
    register: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { body } = req as IRegisterRequest
            // Todo:

            // Body Validation
            const { error, value } = validateJoiSchema<IRegisterRequestBody>(validateRegisterBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            // Phone number parsing and validation
            const { name, consent, phoneNumber, emailAddress, password } = value
            const { countryCode, internationalNumber, isoCode } = quicker.parsePhoneNumber('+' + phoneNumber)
            if (!countryCode || !internationalNumber || !isoCode) {
                return httpError(next, new Error(responseMessage.INVALID_PHONE_NUMBER), req, 422)
            }

            // Timezone
            const timeZone = quicker.countryTimeZone(isoCode)
            if (!timeZone || timeZone.length === 0) {
                return httpError(next, new Error(responseMessage.INVALID_PHONE_NUMBER), req, 422)
            }

            // Check User Existance using email address
            const user = await databaseService.findUserByEmailAddress(emailAddress)
            if (user) {
                return httpError(next, new Error(responseMessage.ALREADY_EXIST('User', emailAddress)), req, 422)
            }

            // Password Encrypt
            const encryptedPassword = await quicker.hashPassword(password)

            // Account confirmation Object data
            const token = quicker.generateRandomeId()
            const code = quicker.generateOtp(6)

            const payload: IUser = {
                name,
                emailAddress,
                phoneNumber: {
                    countryCode,
                    isoCode,
                    internationalNumber
                },
                accountConfirmation: {
                    status: false,
                    token,
                    code,
                    timestamp: null
                },
                passwordReset: {
                    token: null,
                    expiry: null,
                    lastResetAt: null
                },
                lastLoginAt: null,
                role: EUserRole.USER,
                timezone: timeZone[0].name,
                password: encryptedPassword,
                consent
            }
            // Creating user
            const newUser = await databaseService.registerUser(payload)

            // Send confirmation email
            const confirmationUrl = `${config.FRONTEND_URL}/confirmation/${token}?code=${code}`
            const to = [emailAddress]
            const subject = 'Confirm Your Account'
            const text = `Hey ${name}, Please confirm your account by clicking on the link given below\n\n${confirmationUrl}`

            emailService.sendEmail(to, subject, text).catch((err) => {
                logger.error('EMAIL_SERVice', {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    meta: err
                })
            })

            httpResponse(req, res, 201, responseMessage.SUCCESS, { _id: newUser._id })
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },
    confirmation: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {params, query} = req as IConfirmrRequest;
            // Todo
            const { token } = params;
            const {code} =  query;

            // Fetch user by token & code
            const user = await databaseService.findUserByConfirmationTokenAndCode(token, code)
            if(!user){
                return httpError(next,new Error(responseMessage.INVALID_ACCOUNT_CONFIRMATION_TOKEN_OR_CODE), req, 400)
            }
            
            // Check if user confirmed or not
            if(user.accountConfirmation.status){
                return httpError(next,new Error(responseMessage.ACCOUNT_ALREADY_CONFIRMED), req, 400)
            }

            // Account confirm
            user.accountConfirmation.status = true
            user.accountConfirmation.timestamp = dayjs().utc().toDate();

            await user.save()
            // Account confirmation email
             const to = [user.emailAddress]
             const subject = 'Account Confirmed'
             const text = `Your account has been confirmed`
 
             emailService.sendEmail(to, subject, text).catch((err) => {
                 logger.error('EMAIL_SERVice', {
                     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                     meta: err
                 })
             })

            httpResponse(req, res, 200, responseMessage.SUCCESS)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },
}
