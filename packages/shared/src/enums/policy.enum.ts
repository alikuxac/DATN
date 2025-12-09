export enum ENUM_POLICY_ACTION {
    MANAGE = 'manage',
    READ = 'read',
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',

    // Custom action
    ASSIGN_TO_MYSELF = 'assign_to_myself',
}

export enum ENUM_POLICY_SUBJECT {
    AUTH = 'AUTH',
    USER = 'USER',
    SESSION = 'SESSION',
    ACTIVITY = 'ACTIVITY',
    UTILITIES = 'UTILITIES',
    REPORT = 'REPORT',
    TEAM = 'TEAM',
}
