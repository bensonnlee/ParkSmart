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
  originLat?: number | string | null,
  originLng?: number | string | null,
): void {
  const platform = detectPlatform();
  let url: string;

  if (platform === 'ios') {
    // Apple Maps with driving directions
    url = originLat && originLng
      ? `https://maps.apple.com/?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&dirflg=d`
      : `https://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=d`;
  } else {
    // Google Maps with driving directions (Android + desktop)
    url = originLat && originLng
      ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
  }

  window.open(url, '_blank');
}
