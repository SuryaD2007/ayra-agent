import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NotificationsLogProps {
  notifications: any[];
}

const NotificationsLog = ({ notifications }: NotificationsLogProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  const filteredNotifications =
    statusFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] transition-all duration-300 hover:border-primary/50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="glass-panel border-border/50 z-50">
            <SelectItem value="all" className="cursor-pointer transition-colors">
              📋 All Notifications
            </SelectItem>
            <SelectItem value="sent" className="cursor-pointer transition-colors">
              ✅ Sent
            </SelectItem>
            <SelectItem value="pending" className="cursor-pointer transition-colors">
              ⏳ Pending
            </SelectItem>
            <SelectItem value="failed" className="cursor-pointer transition-colors">
              ❌ Failed
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden glass-panel border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 transition-colors">
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Sent</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2 animate-fade-in">
                    <div className="text-4xl">📭</div>
                    <p>No notifications found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((notification) => (
                <TableRow key={notification.id} className="hover:bg-muted/50 transition-all duration-200">
                  <TableCell className="font-medium">
                    {notification.notification_type}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{notification.subject}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(notification.status)} className="transition-all duration-200">
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {notification.sent_at
                      ? new Date(notification.sent_at).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNotification(notification)}
                      className="smooth-bounce"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedNotification}
        onOpenChange={() => setSelectedNotification(null)}
      >
        <DialogContent className="max-w-3xl glass-panel">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedNotification?.subject}</DialogTitle>
            <DialogDescription>
              Type: {selectedNotification?.notification_type} | Status:{' '}
              <Badge variant={getStatusColor(selectedNotification?.status || '')} className="ml-1">
                {selectedNotification?.status}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Email Body:</h4>
              <div 
                className="bg-background border border-border p-6 rounded-md text-sm overflow-auto max-h-[500px] animate-fade-in"
                dangerouslySetInnerHTML={{ __html: selectedNotification?.body || '' }}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p>Created: {new Date(selectedNotification?.created_at).toLocaleString()}</p>
              {selectedNotification?.sent_at && (
                <p>Sent: {new Date(selectedNotification?.sent_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsLog;
