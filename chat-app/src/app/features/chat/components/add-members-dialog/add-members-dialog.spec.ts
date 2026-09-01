import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMembersDialog } from './add-members-dialog';

describe('AddMembersDialog', () => {
  let component: AddMembersDialog;
  let fixture: ComponentFixture<AddMembersDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMembersDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AddMembersDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
