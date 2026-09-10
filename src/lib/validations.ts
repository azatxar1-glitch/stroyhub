import { z } from "zod";
import { MIN_PASSWORD_LENGTH, checkPassword } from "@/lib/password";

/**
 * Правила пароля живут в одном месте: та же проверка выполняется и в
 * браузере, и на сервере, поэтому обойти её через прямой запрос к API
 * не получится.
 */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Минимум ${MIN_PASSWORD_LENGTH} символов`)
  .refine((value) => checkPassword(value).score > 0, {
    message: "Такой пароль слишком простой — придумайте другой",
  });

export const registerSchema = z
  .object({
    name: z.string().min(2, "Введите имя (минимум 2 символа)").max(100),
    email: z.string().email("Некорректный email"),
    password: passwordSchema,
    role: z.enum(["CUSTOMER", "EXECUTOR"]),
    // Согласие проверяется и на сервере: галочку в браузере можно обойти
    // прямым запросом к API, а согласие обязано быть осознанным действием.
    consent: z.literal(true, {
      message: "Нужно принять условия, чтобы зарегистрироваться",
    }),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Схема формы регистрации. Согласие в неё не входит: в интерфейсе это
 * отдельная галочка, которая блокирует кнопку, а на сервере проверяется
 * полной схемой выше.
 */
export const registerFormSchema = registerSchema.omit({ consent: true });
export type RegisterFormInput = z.infer<typeof registerFormSchema>;

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const jobCreateSchema = z.object({
  title: z.string().min(5, "Минимум 5 символов").max(150),
  categoryId: z.string().min(1, "Выберите категорию"),
  description: z.string().min(20, "Опишите задачу подробнее (минимум 20 символов)").max(5000),
  city: z.string().min(2, "Укажите город"),
  address: z.string().max(300).optional().or(z.literal("")),
  locationType: z.enum(["REMOTE", "ON_SITE"]),
  budget: z.coerce.number().int().positive().optional().nullable(),
  deadline: z.string().max(100).optional().or(z.literal("")),
  attachmentUrls: z
    .array(z.object({ url: z.string(), filename: z.string(), type: z.string() }))
    .max(10)
    .optional(),
});
export type JobCreateInput = z.infer<typeof jobCreateSchema>;

export const jobUpdateSchema = jobCreateSchema.partial().extend({
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const proposalCreateSchema = z.object({
  price: z.coerce.number().int().positive("Укажите цену"),
  durationDays: z.coerce.number().int().positive().optional().nullable(),
  comment: z.string().min(5, "Напишите комментарий").max(2000),
});
export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;

export const executorProfileSchema = z.object({
  categoryId: z.string().min(1, "Выберите специализацию"),
  headline: z.string().min(5, "Минимум 5 символов").max(150),
  description: z.string().max(3000).optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(60),
  remoteAvailable: z.boolean(),
  priceFrom: z.coerce.number().int().positive().optional().nullable(),
  availability: z.enum(["AVAILABLE", "BUSY"]),
  skillNames: z.array(z.string().min(1)).max(20).optional(),
});
export type ExecutorProfileInput = z.infer<typeof executorProfileSchema>;

export const userProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
  emailNotifications: z.boolean().optional(),
});

export const portfolioItemSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().min(1),
});

export const messageSchema = z.object({
  text: z.string().min(1, "Введите сообщение").max(4000),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export const orderStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"]),
});

export const complaintSchema = z.object({
  targetType: z.enum(["USER", "JOB"]),
  targetId: z.string().min(1),
  reason: z.string().min(5, "Опишите причину жалобы").max(2000),
});
