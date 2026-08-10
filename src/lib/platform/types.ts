export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "client"
  | "closed";

export type ContactKind = "lead" | "client";

export type MessageChannel = "sms" | "voice" | "meta";

export type MessageDirection = "in" | "out";

export interface PlatformContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  kind: ContactKind;
  stage: PipelineStage;
  tags: string[];
  notes: string;
  /** Meta Messenger / IG scoped user id */
  metaPsid: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface PlatformMessage {
  id: string;
  contactId: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  to: string;
  from: string;
  body: string;
  twilioSid: string | null;
  metaMid: string | null;
  status: string;
  error: string | null;
  sentAt: string;
  sentBy: string;
  durationSec?: number | null;
}

export interface CallLogEntry {
  id: string;
  contactId: string | null;
  to: string;
  from: string;
  twilioSid: string | null;
  status: string;
  direction: "outbound" | "inbound";
  durationSec: number | null;
  startedAt: string;
  endedAt: string | null;
  error: string | null;
}

export interface MetaIntegration {
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
  igUserId: string | null;
  connectedAt: string | null;
  userAccessToken: string | null;
  pageAccessToken: string | null;
}

export interface PlatformData {
  contacts: PlatformContact[];
  messages: PlatformMessage[];
  calls: CallLogEntry[];
  meta: MetaIntegration;
}

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: "new", label: "New lead" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "client", label: "Client" },
  { id: "closed", label: "Closed" },
];
