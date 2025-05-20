import { DayPicker, DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar(props: DayPickerProps) {
  return (
    <DayPicker
      {...props}
      components={{
        IconPrev: () => <ChevronLeft className="h-4 w-4" />,
        IconNext: () => <ChevronRight className="h-4 w-4" />,
      }}
    />
  );
}
