// Client-only device signals attached to every analytics event.

export type DeviceInfo = {
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  device_pixel_ratio: number;
  language: string | null;
  platform: string | null;
  touch: boolean;
  isMobile: boolean;
  device_type: 'mobile' | 'tablet' | 'desktop';
};

export function collectDeviceInfo(): DeviceInfo {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const touch = navigator.maxTouchPoints > 0;

  const device_type: DeviceInfo['device_type'] =
    viewportWidth >= 1024
      ? 'desktop'
      : touch
        ? viewportWidth >= 768
          ? 'tablet'
          : 'mobile'
        : 'desktop';

  return {
    screen_width: screen.width,
    screen_height: screen.height,
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    language: navigator.language ?? null,
    platform: navigator.platform ?? null,
    touch,
    isMobile: device_type === 'mobile',
    device_type,
  };
}
