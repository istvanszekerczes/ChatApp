import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDmDialog } from './create-dm-dialog';

describe('CreateDmDialog', () => {
  let component: CreateDmDialog;
  let fixture: ComponentFixture<CreateDmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDmDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateDmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
