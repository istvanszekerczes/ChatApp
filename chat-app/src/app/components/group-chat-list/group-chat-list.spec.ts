import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupChatList } from './group-chat-list';

describe('GroupChatList', () => {
  let component: GroupChatList;
  let fixture: ComponentFixture<GroupChatList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupChatList],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupChatList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
