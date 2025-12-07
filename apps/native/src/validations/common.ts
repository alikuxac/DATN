import { z } from 'zod';

// Định nghĩa kiểu cho hàm translate
type TFunction = (key: string, options?: any) => string;

// 1. Common Schemas (Chuyển thành hàm)
export const getEmailSchema = (t: TFunction) =>
  z.email(t('VALIDATION.emailInvalid'));

export const getPasswordSchema = (t: TFunction) =>
  z.string()
    .min(6, t('VALIDATION.passwordMin', { min: 6 }))
    .regex(/[a-z]/, t('VALIDATION.passwordLowercase'))
    .regex(/[A-Z]/, t('VALIDATION.passwordUppercase'))
    .regex(/[0-9]/, t('VALIDATION.passwordNumber'));

export const getRequiredStringSchema = (t: TFunction, fieldName: string) =>
  z.string().min(1, t('VALIDATION.fieldRequired', { fieldName }));

// 2. Form Schemas (Builder Functions)

// Login Form
export const getLoginFormSchema = (t: TFunction) => {
  return z.object({
    email: getEmailSchema(t),
    password: getPasswordSchema(t),
  });
};

// Register Form
export const getRegisterSchema = (t: TFunction) => {
  return z.object({
    firstName: z.string().min(1, t('VALIDATION.fieldRequired', { fieldName: t('FIRST_NAME') })),
    lastName: z.string().min(1, t('VALIDATION.fieldRequired', { fieldName: t('LAST_NAME') })),
    email: getEmailSchema(t),
    password: getPasswordSchema(t),
    confirmPassword: z.string().min(1, t('VALIDATION.fieldRequired', { fieldName: t('PASSWORD') })),
  })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('AUTH.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
};

// 3. Export Types
// TypeScript sẽ tự động suy diễn kiểu dữ liệu từ hàm trả về
export type RegisterSchemaType = ReturnType<typeof getRegisterSchema>;
export type RegisterFormData = z.infer<RegisterSchemaType>;

export type LoginSchemaType = ReturnType<typeof getLoginFormSchema>;
export type LoginFormData = z.infer<LoginSchemaType>;

// 4. Helper Validate (Giữ nguyên, nhưng thường ít dùng khi đã tích hợp trực tiếp)
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data, errors: [] };
  }

  return {
    isValid: false,
    data: null,
    errors: result.error.issues.map(err => err.message),
  };
};