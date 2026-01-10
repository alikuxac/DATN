'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell, NotificationList } from '@/components/notifications/NotificationComponents';
import { MapPin, Radio, Bell } from 'lucide-react';

export default function WebSocketDemoPage() {
  const { isConnected, emit } = useSocket();
  const { joinRegion, updateLocation } = useNotifications();
  const [lat, setLat] = useState('10.762622');
  const [lng, setLng] = useState('106.660172');
  const [regionId, setRegionId] = useState('');

  const handleUpdateLocation = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!isNaN(latitude) && !isNaN(longitude)) {
      updateLocation(latitude, longitude);
      alert(`Location updated: ${latitude}, ${longitude}`);
    }
  };

  const handleJoinRegion = () => {
    if (regionId.trim()) {
      joinRegion(regionId);
      alert(`Joined region: ${regionId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WebSocket Demo</h1>
          <p className="text-muted-foreground mt-1">
            Test real-time WebSocket features
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Connection Status */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3">
          <Radio className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
          <div>
            <h2 className="font-semibold">Connection Status</h2>
            <p className="text-sm text-muted-foreground">
              {isConnected ? 'Connected to WebSocket server' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Location Update */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Update Location</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="10.762622"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="106.660172"
              />
            </div>
            <button
              onClick={handleUpdateLocation}
              disabled={!isConnected}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Location
            </button>
          </div>
        </div>

        {/* Join Region */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Join Region</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Region ID</label>
              <input
                type="text"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="region-123"
              />
            </div>
            <button
              onClick={handleJoinRegion}
              disabled={!isConnected || !regionId.trim()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Region
            </button>
            <p className="text-xs text-muted-foreground">
              Subscribe to receive region-specific alerts
            </p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Real-time Notifications</h2>
        <NotificationList />
      </div>

      {/* Instructions */}
      <div className="rounded-lg border bg-muted/50 p-6">
        <h2 className="font-semibold mb-3">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Ensure API server is running on <code className="px-1 py-0.5 bg-muted rounded">localhost:3000</code></li>
          <li>Check connection status above (should show green "Connected")</li>
          <li>Try updating your location - check API logs for the event</li>
          <li>Join a region to subscribe to region-specific events</li>
          <li>Trigger a notification from API to see real-time updates</li>
        </ol>
        <div className="mt-4 p-3 bg-background rounded border">
          <p className="text-xs font-mono">
            API Endpoint: <code>POST /api/notifications</code>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Send notifications via API to test real-time delivery
          </p>
        </div>
      </div>
    </div>
  );
}
