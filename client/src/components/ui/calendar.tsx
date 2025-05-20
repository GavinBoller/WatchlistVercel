import { DayPicker, DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar(props: DayPickerProps) {
  return (
    <DayPicker
      {...props}
      components={{
        Chevron: ({ orientation }) => (
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )
        ),
      }}
    />
  );
}
