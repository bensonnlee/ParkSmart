import { MapPin, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function MapViewPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 flex items-center justify-center">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #003DA5 1px, transparent 1px),
            linear-gradient(to bottom, #003DA5 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Campus Outline Illustration */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <svg width="600" height="400" viewBox="0 0 600 400" fill="none">
          {/* Simple building shapes */}
          <rect x="50" y="100" width="80" height="120" fill="#003DA5" />
          <rect x="160" y="80" width="100" height="140" fill="#003DA5" />
          <rect x="290" y="120" width="90" height="100" fill="#003DA5" />
          <rect x="410" y="90" width="110" height="130" fill="#003DA5" />
          
          {/* Paths */}
          <path d="M 0 200 Q 150 180 300 200 T 600 200" stroke="#003DA5" strokeWidth="8" fill="none" />
          <path d="M 300 0 L 300 400" stroke="#003DA5" strokeWidth="6" fill="none" />
        </svg>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-ucr-blue p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 bg-ucr-blue rounded-xl flex items-center justify-center">
              <MapPin className="size-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">MAP_VIEW</h2>
              <p className="text-sm text-gray-600">Interactive Campus Map Component</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="size-5 text-ucr-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Integration Instructions
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong className="text-ucr-blue">Step 1:</strong> Use <code className="bg-white px-2 py-0.5 rounded text-xs font-mono">Mapsicle</code> or <code className="bg-white px-2 py-0.5 rounded text-xs font-mono">Figmap</code> plugin to generate a vector UCR campus map
              </p>
              <p>
                <strong className="text-ucr-blue">Step 2:</strong> Import the generated map SVG/image into this component
              </p>
              <p>
                <strong className="text-ucr-blue">Step 3:</strong> Position parking pins and destination markers on the map
              </p>
              <p>
                <strong className="text-ucr-blue">Step 4:</strong> Connect interactive overlays using component states
              </p>
            </div>
          </div>

          {/* Plugin Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Recommended Figma Plugins:</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <MapPin className="size-4 text-white" />
                  </div>
                  <h5 className="font-bold text-gray-900">Mapsicle</h5>
                </div>
                <p className="text-xs text-gray-600 mb-3">Generate custom location maps with markers</p>
                <Button size="sm" variant="outline" className="w-full text-xs" disabled>
                  <Download className="size-3 mr-1" />
                  Install Plugin
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <MapPin className="size-4 text-white" />
                  </div>
                  <h5 className="font-bold text-gray-900">Figmap</h5>
                </div>
                <p className="text-xs text-gray-600 mb-3">Embed Google Maps styled vectors</p>
                <Button size="sm" variant="outline" className="w-full text-xs" disabled>
                  <Download className="size-3 mr-1" />
                  Install Plugin
                </Button>
              </div>
            </div>
          </div>

          {/* Alternative Option */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">Or use the official UCR campus map:</p>
            <Button 
              className="w-full bg-ucr-blue hover:bg-ucr-blue-dark"
              onClick={() => window.open('https://campusmap.ucr.edu/', '_blank')}
            >
              <ExternalLink className="size-4 mr-2" />
              Open Official UCR Campus Map
            </Button>
          </div>
        </div>

        {/* Current Implementation Note */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <svg className="size-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-900 mb-1">Development Mode Active</p>
              <p className="text-yellow-800">Currently showing placeholder. Interactive pins and overlays are functional below this frame.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
