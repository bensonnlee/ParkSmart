type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  // Modern API (Chrome 90+): navigator.userAgentData
  const uaData = (navigator as any).userAgentData;
  if (uaData?.platform) {
    const p = uaData.platform.toLowerCase();
    if (p === 'ios') return 'ios';
    if (p === 'android') return 'android';
    return 'desktop';
  }

  // Fallback: navigator.userAgent
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function openMapsDirections(
  destLat: number | string,
  destLng: number | string,
): void {
  const platform = detectPlatform();

  // Omitting origin lets the maps app use the device's live GPS location,
  // which is more accurate and shows a ready-to-tap "Start" button.
  const url = platform === 'ios'
    ? `https://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;

  window.open(url, '_blank');
}
