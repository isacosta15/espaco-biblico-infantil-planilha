import {
  createChild,
  updateChild,
  deleteChild,
  markAttendance,
  unmarkAttendance,
  type Child,
  type ChildInput,
  type ChildUpdate,
} from "@workspace/api-client-react";

const QUEUE_KEY = "ebi_offline_queue";
const CHILDREN_KEY = "ebi_offline_children";
const QUEUE_EVENT = "ebi-offline-queue-changed";

export type OfflineOperation =
  | { id: string; kind: "createChild"; tempId: number; data: ChildInput; createdAt: number }
  | { id: string; kind: "updateChild"; childId: number; data: ChildUpdate; createdAt: number }
  | { id: string; kind: "deleteChild"; childId: number; createdAt: number }
  | { id: string; kind: "markAttendance"; childId: number; attendanceDate: string; createdAt: number }
  | { id: string; kind: "unmarkAttendance"; childId: number; createdAt: number };

type OfflineOperationInput = {
  [K in OfflineOperation["kind"]]: Omit<Extract<OfflineOperation, { kind: K }>, "id" | "createdAt">
}[OfflineOperation["kind"]];

export type OfflineChild = Child & { offlinePending: true };

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readQueue(): OfflineOperation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as OfflineOperation[];
  } catch {
    return [];
  }
}

function readOfflineChildren(): OfflineChild[] {
  try {
    return JSON.parse(localStorage.getItem(CHILDREN_KEY) || "[]") as OfflineChild[];
  } catch {
    return [];
  }
}

function notifyQueueChanged(): void {
  window.dispatchEvent(new Event(QUEUE_EVENT));
}

function writeQueue(queue: OfflineOperation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  notifyQueueChanged();
}

export function getOfflineQueue(): OfflineOperation[] {
  return readQueue();
}

export function getOfflineQueueCount(): number {
  return readQueue().length;
}

export function subscribeToOfflineQueue(listener: () => void): () => void {
  window.addEventListener(QUEUE_EVENT, listener);
  return () => window.removeEventListener(QUEUE_EVENT, listener);
}

export function saveOfflineChild(data: ChildInput): number {
  const tempId = -Date.now();
  const birthDate = data.birthDate;
  const birth = new Date(`${birthDate}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--;
  }

  const child: OfflineChild = {
    id: tempId,
    childNumber: 0,
    fullName: data.fullName,
    birthDate,
    gender: data.gender,
    guardianName: data.guardianName,
    guardianPhone: data.guardianPhone,
    foodRestriction: data.foodRestriction ?? false,
    foodRestrictionDescription: data.foodRestrictionDescription ?? null,
    autism: data.autism ?? false,
    observations: data.observations ?? null,
    congregationId: data.congregationId ?? null,
    congregationName: null,
    age,
    presentToday: false,
    offlinePending: true,
  };

  localStorage.setItem(CHILDREN_KEY, JSON.stringify([...readOfflineChildren(), child]));
  enqueueOfflineOperation({ kind: "createChild", tempId, data });
  return tempId;
}

export function updateOfflineChild(childId: number, data: ChildUpdate): void {
  const children = readOfflineChildren().map((child) =>
    child.id === childId ? { ...child, ...data, offlinePending: true } : child,
  );
  localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
  enqueueOfflineOperation({ kind: "updateChild", childId, data });
}

export function getOfflineChildren(): OfflineChild[] {
  return readOfflineChildren();
}

export function enqueueOfflineOperation(
  operation: OfflineOperationInput,
): void {
  writeQueue([...readQueue(), { ...operation, id: makeId(), createdAt: Date.now() } as OfflineOperation]);
}

export function enqueueOfflineAttendance(childId: number, attendanceDate: string): void {
  enqueueOfflineOperation({ kind: "markAttendance", childId, attendanceDate });
}

export function enqueueOfflineUnmarkAttendance(childId: number): void {
  enqueueOfflineOperation({ kind: "unmarkAttendance", childId });
}

export interface SyncResult {
  synced: number;
  remaining: number;
}

export async function syncOfflineData(
  onProgress?: (completed: number, total: number) => void,
): Promise<SyncResult> {
  const queue = readQueue();
  const idMap = new Map<number, number>();
  let completed = 0;
  const failed: OfflineOperation[] = [];

  for (const operation of queue) {
    try {
      const resolveId = (id: number) => id < 0 ? idMap.get(id) ?? id : id;

      if (operation.kind === "createChild") {
        const created = await createChild(operation.data);
        idMap.set(operation.tempId, created.id);
        localStorage.setItem(
          CHILDREN_KEY,
          JSON.stringify(readOfflineChildren().filter((child) => child.id !== operation.tempId)),
        );
      } else if (operation.kind === "updateChild") {
        await updateChild(resolveId(operation.childId), operation.data);
      } else if (operation.kind === "deleteChild") {
        await deleteChild(resolveId(operation.childId));
      } else if (operation.kind === "markAttendance") {
        await markAttendance({
          childId: resolveId(operation.childId),
          attendanceDate: operation.attendanceDate,
        });
      } else {
        await unmarkAttendance(resolveId(operation.childId));
      }
      completed++;
      onProgress?.(completed, queue.length);
    } catch {
      failed.push(operation);
    }
  }

  writeQueue(failed);
  return { synced: completed, remaining: failed.length };
}