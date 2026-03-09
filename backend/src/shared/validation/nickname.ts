import z from 'zod'
import { NICKNAME_REGEX } from './nickname-regex'

export const NICKNAME_SCHEMA = z.string().max(16).min(4).regex(NICKNAME_REGEX)
