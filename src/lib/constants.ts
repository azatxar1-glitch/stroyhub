export const ROLES = {
  CUSTOMER: "CUSTOMER",
  EXECUTOR: "EXECUTOR",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const JOB_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

export const LOCATION_TYPE = {
  REMOTE: "REMOTE",
  ON_SITE: "ON_SITE",
} as const;
export type LocationType = (typeof LOCATION_TYPE)[keyof typeof LOCATION_TYPE];

export const PROPOSAL_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;
export type ProposalStatus = (typeof PROPOSAL_STATUS)[keyof typeof PROPOSAL_STATUS];

export const ORDER_STATUS = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  REVIEW: "REVIEW",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новая заявка",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["REVIEW", "CANCELLED"],
  REVIEW: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: [],
  CANCELLED: [],
};

export const AVAILABILITY = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
} as const;
export type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];

export const NOTIFICATION_TYPE = {
  PROPOSAL_RECEIVED: "PROPOSAL_RECEIVED",
  PROPOSAL_ACCEPTED: "PROPOSAL_ACCEPTED",
  PROPOSAL_REJECTED: "PROPOSAL_REJECTED",
  NEW_MESSAGE: "NEW_MESSAGE",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
  NEW_REVIEW: "NEW_REVIEW",
} as const;

export const COMPLAINT_STATUS = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

export const CATEGORIES: { name: string; slug: string; icon: string }[] = [
  { name: "ПТО", slug: "pto", icon: "ClipboardList" },
  { name: "Сметчик", slug: "smetchik", icon: "Calculator" },
  { name: "Проектировщик", slug: "proektirovshchik", icon: "Ruler" },
  { name: "Исполнительная документация", slug: "ispolnitelnaya-dokumentaciya", icon: "FileText" },
  { name: "АОСР", slug: "aosr", icon: "FileCheck" },
  { name: "Исполнительные схемы", slug: "ispolnitelnye-shemy", icon: "Map" },
  { name: "КС-2 / КС-3", slug: "ks2-ks3", icon: "Receipt" },
  { name: "Технический надзор", slug: "tehnicheskiy-nadzor", icon: "ShieldCheck" },
  { name: "Прораб", slug: "prorab", icon: "HardHat" },
  { name: "Инженер", slug: "inzhener", icon: "Wrench" },
  { name: "AutoCAD", slug: "autocad", icon: "PenTool" },
  { name: "Revit / BIM", slug: "revit-bim", icon: "Boxes" },
  { name: "Обследование зданий", slug: "obsledovanie-zdaniy", icon: "Search" },
  { name: "Геодезия", slug: "geodeziya", icon: "Compass" },
  { name: "Строительные бригады", slug: "stroitelnye-brigady", icon: "Users" },
  { name: "Отделочные работы", slug: "otdelochnye-raboty", icon: "Paintbrush" },
  { name: "Общестроительные работы", slug: "obshchestroitelnye-raboty", icon: "Building2" },
  { name: "Электрика", slug: "elektrika", icon: "Zap" },
  { name: "Сантехника", slug: "santehnika", icon: "Droplets" },
  { name: "Вентиляция", slug: "ventilyaciya", icon: "Wind" },
  { name: "Фасадные работы", slug: "fasadnye-raboty", icon: "Building" },
  { name: "Кровля", slug: "krovlya", icon: "Home" },
  { name: "Другие строительные услуги", slug: "drugie-uslugi", icon: "MoreHorizontal" },
];
