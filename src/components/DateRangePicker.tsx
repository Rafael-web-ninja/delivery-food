import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export default function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
    }
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    setStartDate(startStr);
    setEndDate(endStr);
    onDateRangeChange(startStr, endStr);
  };

  return (
    <Card className="w-80">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4" />
          Filtrar por período
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePreset(7)}
          >
            7 dias
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePreset(30)}
          >
            30 dias
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePreset(90)}
          >
            90 dias
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePreset(365)}
          >
            1 ano
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="startDate">Data início</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data fim</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={handleApply} 
          className="w-full"
          disabled={!startDate || !endDate}
        >
          Aplicar
        </Button>
      </CardContent>
    </Card>
  );
}