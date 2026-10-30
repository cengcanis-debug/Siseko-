/**
 * @file systemBridge.ts
 * @description Centralized System Synchronization Bridge & Unified Export Bus
 * Eliminates repetitive boilerplate for file generation, reference generation,
 * cryptographic seals, and cross-module state synchronization across ZAtax.
 */

export interface SystemEventPayload {
  sourceModule: string;
  action: string;
  data: Record<string, any>;
  timestamp: string;
}

type SystemEventListener = (event: SystemEventPayload) => void;

class SystemEventBus {
  private listeners: Map<string, Set<SystemEventListener>> = new Map();

  /**
   * Subscribe to a system synchronization topic
   */
  public subscribe(topic: string, listener: SystemEventListener): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(listener);

    return () => {
      this.listeners.get(topic)?.delete(listener);
    };
  }

  /**
   * Publish an event to alight all listening modules
   */
  public publish(topic: string, sourceModule: string, action: string, data: Record<string, any> = {}): void {
    const payload: SystemEventPayload = {
      sourceModule,
      action,
      data,
      timestamp: new Date().toISOString()
    };

    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[SystemBus Error in ${topic}]:`, err);
        }
      });
    }

    // Also notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (err) {
          console.error('[SystemBus Wildcard Error]:', err);
        }
      });
    }
  }
}

export const systemBus = new SystemEventBus();

/**
 * Universal browser file download utility
 * Eliminates repetitive blob creation, DOM anchor mounting, and memory cleanup across all components
 */
export function downloadBlobFile(
  filename: string,
  content: string | Blob,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Standardized alphanumeric submission reference code generator
 */
export function generateSubmissionRef(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^A-Z0-9_-]/gi, '').toUpperCase();
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return `${cleanPrefix}-${timestampPart}-${randomPart}`;
}

/**
 * Standardized formal statutory header formatter for SARS / TAA schedules
 */
export function formatStatutoryDossierHeader(
  actTitle: string,
  scheduleTitle: string,
  refNumber: string,
  entityName: string,
  taxReference: string,
  extraMetadata: Record<string, string | number> = {}
): string[] {
  const lines = [
    '=========================================================================',
    'REPUBLIC OF SOUTH AFRICA - SOUTH AFRICAN REVENUE SERVICE',
    actTitle.toUpperCase(),
    scheduleTitle.toUpperCase(),
    `REFERENCE NUMBER: ${refNumber}`,
    `TAXPAYER ENTITY: ${entityName}`,
    `SARS TAX NUMBER: ${taxReference}`,
    `GENERATED AT: ${new Date().toISOString()}`
  ];

  Object.entries(extraMetadata).forEach(([key, val]) => {
    lines.push(`${key.toUpperCase()}: ${val}`);
  });

  lines.push('=========================================================================');
  return lines;
}
