import { UserDocument } from '@modules/users/repository/entities/user.entity';

export interface IUserDocument extends Omit<UserDocument, 'password'> {}