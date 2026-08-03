import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messageTime',
})

export class MessageTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = new Date(value);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;

    return (
      date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }) + ` ${time}`
    );
  }
}
