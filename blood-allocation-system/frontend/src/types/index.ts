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

export interface BloodBag {
  id: string;
  bagCode: string;
  bloodType: BloodType;
  componentType: BloodComponentType;
  volume: number;
  batchNo: string;
  status: BloodBagStatus;
  collectDate: string;
  expireDate: string;
  collectStation?: string;
  donorCode?: string;
  storageLocation?: string;
  currentAppointmentId?: string;
  currentHandoverId?: string;
  crossMatchConfirmed: boolean;
  crossMatchTime?: string;
  crossMatchOperator?: string;
  temperatureAlert: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentItem {
  id: string;
  appointmentId: string;
  bloodType: BloodType;
  componentType: BloodComponentType;
  quantity: number;
  volumePerUnit?: number;
  allocatedQuantity: number;
  remark?: string;
}

export interface Appointment {
  id: string;
  appointmentNo: string;
  hospitalCode: string;
  hospitalName: string;
  department?: string;
  doctorName?: string;
  patientName?: string;
  patientId?: string;
  urgencyLevel: UrgencyLevel;
  status: AppointmentStatus;
  expectedUseDate: string;
  diagnosis?: string;
  remark?: string;
  crossMatchRequired: boolean;
  rejectReason?: string;
  items: AppointmentItem[];
  approvedBy?: string;
  approvedTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HandoverItem {
  id: string;
  handoverId: string;
  bloodBagId: string;
  bagCode: string;
  scanTime?: string;
  scanOperator?: string;
  temperatureReceived?: number;
  temperatureAlert: boolean;
  accepted: boolean;
  rejectReason?: string;
  remark?: string;
}

export interface Handover {
  id: string;
  handoverNo: string;
  handoverType: HandoverType;
  appointmentId?: string;
  hospitalCode: string;
  hospitalName: string;
  status: HandoverStatus;
  dispatcherName?: string;
  dispatcherTime?: string;
  courierName?: string;
  vehicleNo?: string;
  coldChainDeviceCode?: string;
  receiverName?: string;
  receiveTime?: string;
  receiveHospitalCode?: string;
  rejectReason?: string;
  remark?: string;
  items: HandoverItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TemperatureRecord {
  id: string;
  handoverId?: string;
  bloodBagId?: string;
  coldChainDeviceCode?: string;
  temperature: number;
  status: TemperatureStatus;
  recordTime: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  remark?: string;
  createdAt: string;
}

export interface ReturnedBlood {
  id: string;
  returnNo: string;
  appointmentId?: string;
  handoverId?: string;
  hospitalCode: string;
  hospitalName: string;
  bloodBagId: string;
  bagCode: string;
  reason: ReturnReason;
  status: ReturnedStatus;
  returnTime: string;
  returnOperator: string;
  returnTemperature?: number;
  packageIntact: boolean;
  inspectionResult?: string;
  inspectionTime?: string;
  inspectionOperator?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
