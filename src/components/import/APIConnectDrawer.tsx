import React, { useState } from 'react';
import { X, Plug, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface APIConnectDrawerProps {
  onClose: () => void;
}

interface APIService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  comingSoon: boolean;
}

const apiServices: APIService[] = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Import pages and databases from your Notion workspace',
    icon: <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">N</div>,
    comingSoon: true
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Import messages and files from Slack channels',
    icon: <div className="w-6 h-6 bg-purple-600 rounded text-white flex items-center justify-center text-xs font-bold">#</div>,
    comingSoon: true
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Import repositories, issues, and documentation',
    icon: <div className="w-6 h-6 bg-gray-900 rounded text-white flex items-center justify-center text-xs font-bold">G</div>,
    comingSoon: true
  },
  {
    id: 'drive',
    name: 'Google Drive',
    description: 'Import documents and files from Google Drive',
    icon: <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">D</div>,
    comingSoon: true
  }
];

export const APIConnectDrawer = ({ onClose }: APIConnectDrawerProps) => {
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleConnect = (serviceId: string) => {
    // Placeholder for future API integration
    console.log('Connecting to service:', serviceId);
  };

  const saveWebhookUrl = () => {
    // Placeholder for saving webhook URL
    console.log('Saving webhook URL:', webhookUrl);
  };

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          <Plug size={20} />
          API Integrations
        </DrawerTitle>
        <DrawerClose className="absolute right-4 top-4">
          <X size={20} />
        </DrawerClose>
      </DrawerHeader>

      <div className="px-6 space-y-6">
        {/* Available Services */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Available Services
          </h3>
          <div className="grid gap-3">
            {apiServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {service.icon}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{service.name}</h4>
                          {service.comingSoon && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock size={10} className="mr-1" />
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(service.id)}
                      disabled={service.comingSoon}
                      className="whitespace-nowrap"
                    >
                      {service.comingSoon ? 'Coming Soon' : 'Connect'}
                      {!service.comingSoon && <ExternalLink size={14} className="ml-1" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Custom Integration
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set up a webhook URL to receive data from external services. This can be used for custom integrations or services not listed above.
            </p>
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.example.com/webhook/your-endpoint"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                This URL will be called when data is available for import
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={saveWebhookUrl}
              disabled={!webhookUrl.trim()}
              className="w-full"
            >
              Save Webhook URL
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Clock size={16} />
            Coming Soon
          </h4>
          <p className="text-sm text-muted-foreground">
            API integrations are being developed. Join our community to get notified when these features become available.
          </p>
        </div>
      </div>

      <DrawerFooter className="flex flex-row gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
};