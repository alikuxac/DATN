export enum ENUM_REPORT_SEVERITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ENUM_REPORT_STATUS {
  PENDING = 'pending', // Mặc định khi user mới tạo
  REJECTED = 'rejected', // Báo cáo bị từ chối (ví dụ: spam, không hợp lệ)
  VERIFIED = 'verified', //
  IN_PROGRESS = 'in_progress', // Đang được xử lý
  CANCELLED = 'cancelled', // Báo cáo bị hủy bỏ bởi user hoặc hệ thống
  RESOLVED = 'resolved', // Đã được xử lý xong
}

export enum ENUM_REPORT_LOCATION_TYPE {
  POINT = 'Point',
}

export enum ENUM_REPORT_TYPE {
  FOOD = 'food',
  WATER = 'water',
  MEDICAL = 'medical',
  EVACUATION = 'evacuation',
  OTHER = 'other',
}