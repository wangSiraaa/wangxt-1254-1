export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum BloodComponentType {
  RED_CELLS = '红细胞',
  PLASMA = '血浆',
  PLATELETS = '血小板',
  CRYOPRECIPITATE = '冷沉淀',
  WHOLE_BLOOD = '全血',
  WHITE_CELLS = '白细胞',
}

export enum BloodBagStatus {
  IN_STOCK = 'in_stock',
  PREEMPTED = 'preempted',
  ALLOCATED = 'allocated',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  RETURNED = 'returned',
  USED = 'used',
  EXPIRED = 'expired',
  DISCARDED = 'discarded',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ALLOCATING = 'allocating',
  ALLOCATED = 'allocated',
  CROSS_MATCHING = 'cross_matching',
  CROSS_MATCH_CONFIRMED = 'cross_match_confirmed',
  CROSS_MATCH_FAILED = 'cross_match_failed',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  PARTIAL_RETURNED = 'partial_returned',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum HandoverStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  REJECTED = 'rejected',
}

export enum HandoverType {
  OUTBOUND = 'outbound',
  RETURN = 'return',
}

export enum TemperatureStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  OVER_LIMIT = 'over_limit',
}

export enum ReturnedStatus {
  PENDING = 'pending',
  INSPECTING = 'inspecting',
  RE_INVENTORY = 're_inventory',
  DISCARDED = 'discarded',
}

export enum ReturnReason {
  EXPIRED = 'expired',
  BROKEN = 'broken',
  WRONG_TYPE = 'wrong_type',
  NOT_USED = 'not_used',
  QUALITY_ISSUE = 'quality_issue',
  OTHER = 'other',
}

export enum UrgencyLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}
