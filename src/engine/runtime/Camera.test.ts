import { Camera } from './Camera';

describe('Camera', () => {
  it('follows a target', () => {
    const camera = new Camera(320, 240, 640, 480);
    camera.followTarget(() => ({ x: 200, y: 150 }));

    camera.update();

    const vp = camera.getViewport();
    expect(vp.x).toBe(200);
    expect(vp.y).toBe(150);
  });

  it('clamps to map boundaries', () => {
    const camera = new Camera(320, 240, 640, 480);
    // Target near top-left corner
    camera.followTarget(() => ({ x: 50, y: 50 }));
    camera.update();

    const vp = camera.getViewport();
    // Half viewport = 160, 120. Camera can't go below that.
    expect(vp.x).toBe(160);
    expect(vp.y).toBe(120);
  });

  it('clamps to bottom-right boundary', () => {
    const camera = new Camera(320, 240, 640, 480);
    camera.followTarget(() => ({ x: 600, y: 450 }));
    camera.update();

    const vp = camera.getViewport();
    // Max: mapWidth - halfW = 640 - 160 = 480, mapHeight - halfH = 480 - 120 = 360
    expect(vp.x).toBe(480);
    expect(vp.y).toBe(360);
  });

  it('centers when map is smaller than viewport', () => {
    const camera = new Camera(320, 240, 200, 100);
    camera.followTarget(() => ({ x: 50, y: 50 }));
    camera.update();

    const vp = camera.getViewport();
    expect(vp.x).toBe(100); // center of 200
    expect(vp.y).toBe(50);  // center of 100
  });

  it('works without a follow target', () => {
    const camera = new Camera(320, 240, 640, 480);
    camera.x = 300;
    camera.y = 200;
    camera.update();

    const vp = camera.getViewport();
    expect(vp.x).toBe(300);
    expect(vp.y).toBe(200);
  });

  it('applies zoom to clamping', () => {
    const camera = new Camera(320, 240, 640, 480);
    camera.zoom = 2;
    camera.followTarget(() => ({ x: 50, y: 50 }));
    camera.update();

    const vp = camera.getViewport();
    // Half viewport at zoom 2 = 80, 60
    expect(vp.x).toBe(80);
    expect(vp.y).toBe(60);
  });

  it('updates map size', () => {
    const camera = new Camera(320, 240, 640, 480);
    camera.setMapSize(1024, 768);
    camera.followTarget(() => ({ x: 900, y: 700 }));
    camera.update();

    const vp = camera.getViewport();
    // Max: 1024 - 160 = 864, 768 - 120 = 648
    expect(vp.x).toBe(864);
    expect(vp.y).toBe(648);
  });

  it('handles null target from getter', () => {
    const camera = new Camera(320, 240, 640, 480);
    camera.x = 300;
    camera.y = 200;
    camera.followTarget(() => null);
    camera.update();

    // Position unchanged
    const vp = camera.getViewport();
    expect(vp.x).toBe(300);
    expect(vp.y).toBe(200);
  });
});
