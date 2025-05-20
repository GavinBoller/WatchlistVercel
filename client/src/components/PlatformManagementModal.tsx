import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Platform } from '@shared/schema';

interface PlatformManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlatform: (platform: Platform) => void;
}

export default function PlatformManagementModal({ isOpen, onClose, onAddPlatform }: PlatformManagementModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('http://localhost:3000/api/platforms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });
    const platform = await response.json();
    onAddPlatform(platform);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Platform</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Platform name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Platform</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
