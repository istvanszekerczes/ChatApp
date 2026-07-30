import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateChatDialog } from './create-chat-dialog';

describe('CreateChatDialog', () => {
  let component: CreateChatDialog;
  let fixture: ComponentFixture<CreateChatDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChatDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateChatDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
