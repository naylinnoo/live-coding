import React, {
    FC,
    useCallback,
    useEffect,
    SyntheticEvent,
    ChangeEvent,
} from "react"
import useModels from "@packages/react-use-models"
import useValidator from "@packages/react-joi"
import Joi from "joi"
import {
    validateCardNumber,
    formatCardNumber,
    formatCardExpiry,
    parseCardType,
    parseCardExpiry,
    validateCardExpiry,
    validateCardCVC,
} from "creditcardutils"

// Styled Elements
import {
    Actions,
    Container,
    Fields,
    ErrorMessage,
    FieldControl,
    FieldLabel,
    Input,
    Form,
    FieldGroups,
    FieldsMerge,
    InputWrapper,
    CardImageWrapper,
    CardImage,
    Submit,
} from "./index.styled"

import Visa from "@components/svgs/visa.svg"
import MasterCard from "@components/svgs/mastercard.svg"
import Cvv from "@components/svgs/cvv.svg"

type TypeCheckoutFormDefaultValues = {
    email: string | null
    card_number: string | null
    card_expire: string | null
    cvv: string | null
}

export type TypeCheckoutFormValues = NonNullable<TypeCheckoutFormDefaultValues>

export interface CheckoutFormProps {
    onSuccess: (values: TypeCheckoutFormValues) => void
    loading?: boolean
    submitText?: string
}

const defaultState: TypeCheckoutFormDefaultValues = {
    email: null,
    card_number: null,
    card_expire: null,
    cvv: null,
}

const validCardType = ["visa", "mastercard"]
const getValidCardsMessage = () => {
    return validCardType.join(", ").replace(/,(?!.*,)/gim, " or")
}

const CheckoutForm: FC<CheckoutFormProps> = ({
    onSuccess,
    loading = false,
    submitText = "Submit",
}) => {
    const { models, register, updateModel } =
        useModels<TypeCheckoutFormDefaultValues>({
            defaultState,
        })
    const { state, setData } = useValidator({
        initialData: defaultState,
        schema: Joi.object({
            email: Joi.string()
                .email({
                    tlds: { allow: false },
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.email": "Must be a valid email",
                    "any.required": "Required",
                }),
            card_number: Joi.string()
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardNumber(value)) {
                            return helpers.error("string.cardNumber")
                        }
                    }
                    return value
                })
                .custom((value, helpers) => {
                    const type = parseCardType(value)
                    if (validCardType.includes(type)) {
                        return value
                    }
                    return helpers.error("string.cardType")
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardNumber": "Must be a valid card",
                    "string.cardType": `Must be either ${getValidCardsMessage()}`,
                    "any.required": "Required",
                }),
            card_expire: Joi.string()
                .custom((value, helpers) => {
                    const { month, year } = parseCardExpiry(value)
                    if (!validateCardExpiry(month, year)) {
                        return helpers.error("string.cardExpired")
                    }
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardExpired": "This card is expired try new card",
                    "any.required": "Required",
                }),
            cvv: Joi.string()
                .regex(/^[0-9]+$/)
                .length(3)
                .custom((value, helpers) => {
                    if (!validateCardCVC(value)) {
                        return helpers.error("string.invalid")
                    }
                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.length": "Maximum 3 digits",
                    "any.required": "Required",
                    "string.pattern.base": "Numbers only",
                }),
        }),
    })

    const getErrors = useCallback(
        (field) => {
            return state.$errors[field]
                .map((data: any) => data.$message)
                .join(",")
        },
        [state.$errors]
    )

    const onSubmit = (e: SyntheticEvent) => {
        e.preventDefault()

        onSuccess(state.$data)
    }

    const checkCard = (cardType: string) =>
        parseCardType(models.card_number) === cardType

    const formatter = {
        cardNumber: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardNumber(e.target.value)

            updateModel("card_number", value)
        },
        cardExpire: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardExpiry(e.target.value)

            updateModel("card_expire", value)
        },
    }

    // Sync model <-> validator
    useEffect(() => {
        setData(models)
    }, [models])

    return (
        <Container>
            <Form onSubmit={onSubmit}>
                <Fields>
                    <FieldControl>
                        <FieldLabel error={!!getErrors("email")}>
                            Email
                        </FieldLabel>

                        <Input
                            {...register.input({ name: "email" })}
                            type="email"
                            placeholder="you@company.com"
                            autoComplete="current-email"
                        />
                    </FieldControl>

                    {getErrors("email") && (
                        <ErrorMessage>{getErrors("email")}</ErrorMessage>
                    )}
                </Fields>

                <FieldGroups>
                    <Fields>
                        <FieldControl>
                            <FieldLabel error={!!getErrors("card_number")}>
                                Card information
                            </FieldLabel>

                            <InputWrapper>
                                <Input
                                    {...register.input({
                                        name: "card_number",
                                        onChange: formatter.cardNumber,
                                    })}
                                    type="text"
                                    placeholder="1234 1234 1234 1234"
                                />
                                <CardImageWrapper>
                                    <CardImage
                                        src={Visa}
                                        isActive={checkCard("visa")}
                                    />
                                    <CardImage
                                        src={MasterCard}
                                        isActive={checkCard("mastercard")}
                                    />
                                </CardImageWrapper>
                            </InputWrapper>
                        </FieldControl>

                        {getErrors("card_number") && (
                            <ErrorMessage>
                                {getErrors("card_number")}
                            </ErrorMessage>
                        )}
                    </Fields>

                    <FieldsMerge>
                        <Fields>
                            <Input
                                {...register.input({
                                    name: "card_expire",
                                    onChange: formatter.cardExpire,
                                })}
                                type="text"
                                placeholder="MM / YY"
                            />

                            {getErrors("card_expire") && (
                                <ErrorMessage>
                                    {getErrors("card_expire")}
                                </ErrorMessage>
                            )}
                        </Fields>

                        <Fields>
                            <InputWrapper>
                                <Input
                                    {...register.input({ name: "cvv" })}
                                    type="text"
                                    placeholder="123"
                                />
                                <CardImageWrapper>
                                    <CardImage src={Cvv} isActive={true} />
                                </CardImageWrapper>
                            </InputWrapper>

                            {getErrors("cvv") && (
                                <ErrorMessage>{getErrors("cvv")}</ErrorMessage>
                            )}
                        </Fields>
                    </FieldsMerge>
                </FieldGroups>

                <Actions>
                    <Submit disabled={state.$auto_invalid || loading}>
                        {submitText}
                    </Submit>
                </Actions>
            </Form>
        </Container>
    )
}

export default CheckoutForm
