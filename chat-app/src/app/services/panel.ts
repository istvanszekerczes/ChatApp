import { Service, signal } from '@angular/core';

export type Panel = 'left' | 'right' | 'info';

@Service()
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