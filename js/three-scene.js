(function () {
  function edged(mesh, color, opacity) {
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 20),
      new THREE.LineBasicMaterial({ color: color !== undefined ? color : 0x000000, transparent: true, opacity: opacity !== undefined ? opacity : 0.35 })
    );
    mesh.add(edges);
    return mesh;
  }

  function buildNetwork() {
    var group = new THREE.Group();
    var coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    var innerGeo = new THREE.IcosahedronGeometry(0.9, 0);
    var innerMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true, transparent: true, opacity: 0.6 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);
    group.userData.onFrame = function () { inner.rotation.y -= 0.006; };

    var pointsMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.07 });
    group.add(new THREE.Points(coreGeo, pointsMat));
    return group;
  }

  function buildRubik() {
    var group = new THREE.Group();
    var size = 0.64, gap = 0.035, step = size + gap;

    // Solid black core so the gaps between cubies read as plastic, not empty space.
    var core = new THREE.Mesh(
      new THREE.BoxGeometry(step * 3 - gap, step * 3 - gap, step * 3 - gap),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.6 })
    );
    group.add(core);

    var colors = { px: 0xd21f1f, nx: 0xff7a1a, py: 0xf7f7f2, ny: 0xf6d51f, pz: 0x159b48, nz: 0x1e4fd8 };
    var stickerGeo = new THREE.BoxGeometry(size * 0.86, size * 0.86, 0.05);
    function sticker(color) {
      return new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
    }

    [-1, 0, 1].forEach(function (x) {
      [-1, 0, 1].forEach(function (y) {
        [-1, 0, 1].forEach(function (z) {
          if (x === 0 && y === 0 && z === 0) return;
          var faces = [
            { cond: x === 1, color: colors.px, rot: [0, Math.PI / 2, 0], off: [size / 2 + 0.001, 0, 0] },
            { cond: x === -1, color: colors.nx, rot: [0, -Math.PI / 2, 0], off: [-size / 2 - 0.001, 0, 0] },
            { cond: y === 1, color: colors.py, rot: [-Math.PI / 2, 0, 0], off: [0, size / 2 + 0.001, 0] },
            { cond: y === -1, color: colors.ny, rot: [Math.PI / 2, 0, 0], off: [0, -size / 2 - 0.001, 0] },
            { cond: z === 1, color: colors.pz, rot: [0, 0, 0], off: [0, 0, size / 2 + 0.001] },
            { cond: z === -1, color: colors.nz, rot: [0, Math.PI, 0], off: [0, 0, -size / 2 - 0.001] }
          ];
          faces.forEach(function (f) {
            if (!f.cond) return;
            var mesh = new THREE.Mesh(stickerGeo, sticker(f.color));
            mesh.position.set(x * step + f.off[0], y * step + f.off[1], z * step + f.off[2]);
            mesh.rotation.set(f.rot[0], f.rot[1], f.rot[2]);
            group.add(mesh);
          });
        });
      });
    });
    return group;
  }

  function buildPistol() {
    var group = new THREE.Group();
    var polymer = new THREE.MeshPhysicalMaterial({ color: 0x1b1c1f, roughness: 0.75, clearcoat: 0.15 });
    var steel = new THREE.MeshPhysicalMaterial({ color: 0x3a3d44, metalness: 0.9, roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.25 });
    var darkSteel = new THREE.MeshStandardMaterial({ color: 0x111214, metalness: 0.7, roughness: 0.4 });
    var accent = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e5a66, emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.3 });

    // Slide (upper, steel)
    var slide = edged(new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.32, 0.36), steel), 0x000000, 0.4);
    slide.position.set(0.12, 0.36, 0);
    group.add(slide);

    // Slide serrations (rear grip grooves)
    for (var i = 0; i < 6; i++) {
      var groove = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.3, 0.38), darkSteel);
      groove.position.set(-0.62 + i * 0.055, 0.36, 0);
      group.add(groove);
    }

    // Front & rear sights
    var rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.28), darkSteel);
    rearSight.position.set(-0.78, 0.55, 0);
    group.add(rearSight);
    var frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.05), darkSteel);
    frontSight.position.set(0.98, 0.55, 0);
    group.add(frontSight);

    // Barrel / muzzle
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 24), darkSteel);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.07, 0.36, 0);
    group.add(barrel);
    var muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 10, 20), accent);
    muzzle.rotation.y = Math.PI / 2;
    muzzle.position.set(1.15, 0.36, 0);
    group.add(muzzle);

    // Frame / dust cover (polymer, lower)
    var frame = edged(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.34), polymer), 0x000000, 0.3);
    frame.position.set(-0.2, 0.14, 0);
    group.add(frame);

    // Grip (angled polymer)
    var grip = edged(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.92, 0.3), polymer), 0x000000, 0.3);
    grip.position.set(-0.62, -0.44, 0);
    grip.rotation.z = -0.22;
    group.add(grip);

    // Textured grip panels (stipple hint via thin ridges)
    for (var g = 0; g < 4; g++) {
      var ridge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.32), darkSteel);
      ridge.position.set(-0.5 - g * 0.07, -0.4, 0);
      ridge.rotation.z = -0.22;
      group.add(ridge);
    }

    // Magazine base plate
    var magBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.28), darkSteel);
    magBase.position.set(-0.78, -0.92, 0);
    magBase.rotation.z = -0.22;
    group.add(magBase);

    // Trigger guard + trigger
    var guard = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.032, 10, 24, Math.PI * 1.4), polymer);
    guard.position.set(-0.18, -0.14, 0);
    guard.rotation.z = Math.PI * 0.62;
    group.add(guard);
    var trigger = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.07), accent);
    trigger.position.set(-0.16, -0.12, 0);
    group.add(trigger);

    group.rotation.z = 0.03;
    group.scale.setScalar(1.05);
    return group;
  }

  function makeWheel(radius, width, tireMat, rimMat) {
    var wheel = new THREE.Group();
    var tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 28), tireMat);
    tire.rotation.x = Math.PI / 2;
    wheel.add(tire);
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width * 1.03, 24), rimMat);
    rim.rotation.x = Math.PI / 2;
    wheel.add(rim);
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, width * 1.08, 16), tireMat);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    for (var i = 0; i < 5; i++) {
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.05, radius * 0.13, width * 0.82), rimMat);
      spoke.position.x = radius * 0.28;
      spoke.rotation.z = (i / 5) * Math.PI * 2;
      wheel.add(spoke);
    }
    return wheel;
  }

  function buildCar() {
    var group = new THREE.Group();
    var bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x232837, metalness: 0.55, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x0c0e13, metalness: 0.4, roughness: 0.6 });
    var glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9adcea, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.45 });
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.85 });
    var rimMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, metalness: 0.85, roughness: 0.3 });
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22d3ee, emissiveIntensity: 0.5 });
    var indicatorMat = new THREE.MeshStandardMaterial({ color: 0xffb020, emissive: 0xffb020, emissiveIntensity: 0.3 });

    // Main boxy body
    var body = edged(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.85, 1.2), bodyMat), 0x000000, 0.25);
    body.position.y = 0.02;
    group.add(body);

    // Wheel-arch flares (G-Class signature)
    [[1.05, -0.72], [1.05, 0.72], [-1.05, -0.72], [-1.05, 0.72]].forEach(function (p) {
      var flare = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.2), trimMat);
      flare.position.set(p[0], -0.32, p[1] > 0 ? 0.68 : -0.68);
      group.add(flare);
    });

    // Cabin / flat roof (signature boxy greenhouse)
    var cabin = edged(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.6, 1.12), bodyMat), 0x000000, 0.25);
    cabin.position.set(-0.05, 0.73, 0);
    group.add(cabin);

    var windshield = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.4, 1.14), glassMat);
    windshield.position.set(-0.05, 0.76, 0);
    group.add(windshield);

    // Roof rails
    [-0.42, 0.42].forEach(function (z) {
      var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 10), trimMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(-0.1, 1.05, z);
      group.add(rail);
    });

    // Hood + grille
    var hood = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 1.14), trimMat);
    hood.position.set(1.15, 0.4, 0);
    group.add(hood);
    for (var i = 0; i < 5; i++) {
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.06), trimMat);
      bar.position.set(1.36, 0.08, -0.4 + i * 0.2);
      group.add(bar);
    }

    // Round headlights + indicators (G-Class signature round lamps)
    [-0.42, 0.42].forEach(function (z) {
      var housing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24), trimMat);
      housing.rotation.z = Math.PI / 2;
      housing.position.set(1.35, 0.1, z);
      group.add(housing);
      var lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), lightMat);
      lamp.rotation.z = Math.PI / 2;
      lamp.position.set(1.39, 0.1, z);
      group.add(lamp);
      var indicator = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.16), indicatorMat);
      indicator.position.set(1.36, 0.1, z > 0 ? 0.58 : -0.58);
      group.add(indicator);
    });

    // Stepped front & rear bumpers (signature G-Wagon step)
    [1.34, -1.34].forEach(function (x) {
      var bumper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 1.22), trimMat);
      bumper.position.set(x, -0.28, 0);
      group.add(bumper);
    });

    // Side mirrors
    [-0.42, 0.42].forEach(function (z) {
      var mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.08), trimMat);
      mirror.position.set(0.62, 0.62, z > 0 ? 0.62 : -0.62);
      group.add(mirror);
    });

    // Door seam lines
    [0.35, -0.35].forEach(function (x) {
      var seam = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.7, 1.22), trimMat);
      seam.position.set(x, 0.05, 0);
      group.add(seam);
    });

    // Rear-mounted spare tire (signature)
    var spareTire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 12, 24), tireMat);
    spareTire.rotation.y = Math.PI / 2;
    spareTire.position.set(-1.42, 0.18, 0);
    group.add(spareTire);
    var spareRim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 20), rimMat);
    spareRim.rotation.z = Math.PI / 2;
    spareRim.position.set(-1.46, 0.18, 0);
    group.add(spareRim);

    // Wheels with rims + spokes
    [[0.95, -0.78], [0.95, 0.78], [-0.95, -0.78], [-0.95, 0.78]].forEach(function (p) {
      var wheel = makeWheel(0.36, 0.26, tireMat, rimMat);
      wheel.position.set(p[0], -0.42, p[1]);
      group.add(wheel);
    });

    group.scale.setScalar(0.92);
    return group;
  }

  function init() {
    var wrap = document.getElementById("studio3d-canvas-wrap");
    if (!wrap || typeof THREE === "undefined") return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0.15, 6);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if ("toneMapping" in renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; }
    wrap.appendChild(renderer.domElement);

    // Three-point-ish light rig for believable shading + a cool rim light matching the brand accent.
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    var key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(4, 5, 6);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xbcd8ff, 0.35);
    fill.position.set(-4, 2, 2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0x22d3ee, 0.6);
    rim.position.set(-2, 3, -5);
    scene.add(rim);

    var stage = new THREE.Group();
    scene.add(stage);

    var models = {
      network: buildNetwork(),
      pistol: buildPistol(),
      rubik: buildRubik(),
      car: buildCar()
    };
    var order = ["network", "pistol", "rubik", "car"];
    var initial = (window.pendingStudio3DModel && models[window.pendingStudio3DModel]) ? window.pendingStudio3DModel : "network";
    order.forEach(function (key2) {
      models[key2].visible = key2 === initial;
      stage.add(models[key2]);
    });

    window.setStudio3DModel = function (name) {
      if (!models[name]) return;
      order.forEach(function (key2) { models[key2].visible = key2 === name; });
      stage.rotation.set(0, 0, 0);
    };

    // Drag to rotate
    var isDragging = false;
    var prev = { x: 0, y: 0 };
    var velocity = { x: 0, y: 0.003 };

    function pointerDown(x, y) { isDragging = true; prev.x = x; prev.y = y; }
    function pointerMove(x, y) {
      if (!isDragging) return;
      var dx = x - prev.x;
      var dy = y - prev.y;
      stage.rotation.y += dx * 0.005;
      stage.rotation.x += dy * 0.005;
      velocity.x = dy * 0.0002;
      velocity.y = dx * 0.0002;
      prev.x = x; prev.y = y;
    }
    function pointerUp() { isDragging = false; }

    wrap.addEventListener("mousedown", function (e) { pointerDown(e.clientX, e.clientY); });
    window.addEventListener("mousemove", function (e) { pointerMove(e.clientX, e.clientY); });
    window.addEventListener("mouseup", pointerUp);

    wrap.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      pointerDown(t.clientX, t.clientY);
    }, { passive: true });
    wrap.addEventListener("touchmove", function (e) {
      var t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    }, { passive: true });
    wrap.addEventListener("touchend", pointerUp);

    function animate() {
      requestAnimationFrame(animate);
      if (!isDragging) {
        stage.rotation.y += velocity.y;
        stage.rotation.x += velocity.x;
        velocity.x *= 0.98;
        velocity.y += (0.003 - velocity.y) * 0.01;
      }
      order.forEach(function (key2) {
        if (models[key2].visible && models[key2].userData.onFrame) models[key2].userData.onFrame();
      });
      renderer.render(scene, camera);
    }
    animate();

    function resize() {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(wrap);
    }
  }

  window.initStudio3D = init;
})();
