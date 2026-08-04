import { Service, signal } from '@angular/core';

export type Panel = 'left' | 'right' | 'info';

@Service()

/**
 * Service to manage the state of panels in the application.
 * It provides methods to check if a panel is open, toggle a panel's state, and close all panels.
 */
export class PanelService {
  private readonly openPanel = signal<Panel | null>(null);

  isOpen(panel: Panel): boolean {
    return this.openPanel() === panel;
  }

  toggle(panel: Panel) {
    this.openPanel.update(current => (current === panel ? null : panel));
  }

  closeAll() {
    this.openPanel.set(null);
  }
}