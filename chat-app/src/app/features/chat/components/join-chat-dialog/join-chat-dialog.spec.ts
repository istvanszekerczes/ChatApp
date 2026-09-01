import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinChatDialog } from './join-chat-dialog';

describe('JoinChatDialog', () => {
  let component: JoinChatDialog;
  let fixture: ComponentFixture<JoinChatDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinChatDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinChatDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
