
export class ActivityCreateEvent {
  user: any; // UserDocument | string
  type: string; // ENUM_ACTIVITY_TYPE
  description: string;
  by?: any; // UserDocument | string
  properties?: Record<string, any>;
  session?: any; // ClientSession

  constructor(partial: Partial<ActivityCreateEvent>) {
    Object.assign(this, partial);
  }
}
