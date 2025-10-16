import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DocSection {
  id: string;
  title: string;
  icon: string;
  expanded: boolean;
}

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css']
})
export class DocumentationComponent {
  @Output() closeClick = new EventEmitter<void>();
  showDisclaimer = false;

  sections = signal<DocSection[]>([
    { id: 'overview', title: 'App Overview', icon: '📱', expanded: true },
    { id: 'brainwaves', title: 'Brainwave Bands Explained', icon: '🧠', expanded: false },
    { id: 'display', title: 'Primary vs Live States', icon: '📊', expanded: false },
    { id: 'confidence', title: 'Confidence Levels', icon: '⭐', expanded: false },
    { id: 'graph', title: 'Live Signal Graph', icon: '📈', expanded: false },
    { id: 'bandpower', title: 'Band Power Distribution', icon: '📉', expanded: false },
    { id: 'alerts', title: 'Alert System', icon: '🔔', expanded: false },
    { id: 'audio', title: 'Audio Configuration', icon: '🔊', expanded: false },
    { id: 'sessions', title: 'Session Recording', icon: '⏺️', expanded: false },
    { id: 'data', title: 'Data Management', icon: '💾', expanded: false },
    { id: 'calculations', title: 'How Calculations Work', icon: '🔢', expanded: false }
  ]);

  toggleSection(sectionId: string): void {
    this.sections.update(sections => 
      sections.map(s => 
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s
      )
    );
  }

  expandAll(): void {
    this.sections.update(sections => 
      sections.map(s => ({ ...s, expanded: true }))
    );
  }

  collapseAll(): void {
    this.sections.update(sections => 
      sections.map(s => ({ ...s, expanded: false }))
    );
  }

  close(): void {
    this.closeClick.emit();
  }
}
