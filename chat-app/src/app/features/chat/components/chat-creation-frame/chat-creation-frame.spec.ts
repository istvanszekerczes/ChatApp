import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatCreationFrame } from './chat-creation-frame';

describe('ChatCreationFrame', () => {
  let component: ChatCreationFrame;
  let fixture: ComponentFixture<ChatCreationFrame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatCreationFrame],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatCreationFrame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
