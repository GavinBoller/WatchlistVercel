import { DayPicker, DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar(props: DayPickerProps) {
  return (
    <DayPicker
      {...props}
      components={{
        ChevronLeft: () => <ChevronLeft className="h-4 w-4" />,
        ChevronRight: () => <ChevronRight className="h-4 w-4" />,
      }}
    />
  );
}
