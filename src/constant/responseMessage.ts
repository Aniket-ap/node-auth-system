export default {
    SUCCESS: `operation successfull`,
    SOMETHING_WENT_WRONG: `Something Went Wrong`,
    NOT_FOUND: (entity: string) => `${entity} not found`,
    TOO_MANY_REQUESTS: `Too Many Requests`,
    INVALID_PHONE_NUMBER: 'Invalid Phone Number',
    ALREADY_EXIST: (entity: string, identifier: string) => `${entity} is already exist with ${identifier}`,
    INVALID_ACCOUNT_CONFIRMATION_TOKEN_OR_CODE: `Invalid account confirmation token or code`,
    ACCOUNT_ALREADY_CONFIRMED: `Account Already Confirmed`
}